import type { MemoryOutcomeStatus, MemoryPlaybook } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  PLAYBOOK_DEMOTION_MAX_FAILURE_RATE,
  PLAYBOOK_DEMOTION_MAX_RISK,
  PLAYBOOK_DEMOTION_MIN_EXECUTIONS,
  PLAYBOOK_DEMOTION_MIN_RECENT_SUCCESS_RATE,
  PLAYBOOK_PROMOTION_MAX_RISK,
  PLAYBOOK_PROMOTION_MIN_EXECUTIONS,
  PLAYBOOK_PROMOTION_MIN_SUCCESS_RATE,
  PLAYBOOK_PROMOTION_MIN_SUCCESSES,
  PLAYBOOK_RECENT_WINDOW,
} from "../constants/playbook-memory.constants";
import { playbookLog } from "../playbook-memory.logger";
import { playbookTelemetry } from "../playbook-memory.telemetry";
import * as repo from "../repository/playbook-memory.repository";
import { recalculatePlaybookStats, recalculateVersionStats } from "./playbook-memory-learning.service";

const PB = "[playbook]";

function recentSuccessRate(states: MemoryOutcomeStatus[]): number {
  if (states.length === 0) return 0;
  return states.filter((s) => s === "SUCCEEDED").length / states.length;
}

export type PromotionEligibility = {
  eligible: boolean;
  reasons: string[];
  metrics: {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    successRate: number;
    recentSuccessRate: number;
    recentWindow: number;
    avgRiskScore: number | null;
  };
};

export type DemotionEligibility = {
  shouldDemote: boolean;
  reasons: string[];
  metrics: {
    totalExecutions: number;
    failedExecutions: number;
    failureRate: number;
    recentSuccessRate: number;
    recentWindow: number;
    avgRiskScore: number | null;
  };
};

export type SafeResult<T> = { ok: true; data: T } | { ok: false; error: string };

const EMPTY_METRICS: PromotionEligibility["metrics"] = {
  totalExecutions: 0,
  successfulExecutions: 0,
  failedExecutions: 0,
  successRate: 0,
  recentSuccessRate: 0,
  recentWindow: 0,
  avgRiskScore: null,
};

function metricsForPromotion(pb: MemoryPlaybook, recent: MemoryOutcomeStatus[]): PromotionEligibility["metrics"] {
  const t = pb.totalExecutions;
  const succ = pb.successfulExecutions;
  const fail = pb.failedExecutions;
  return {
    totalExecutions: t,
    successfulExecutions: succ,
    failedExecutions: fail,
    successRate: t > 0 ? succ / t : 0,
    recentSuccessRate: recentSuccessRate(recent),
    recentWindow: recent.length,
    avgRiskScore: pb.avgRiskScore,
  };
}

function metricsForDemotion(pb: MemoryPlaybook, recent: MemoryOutcomeStatus[]): DemotionEligibility["metrics"] {
  const t = pb.totalExecutions;
  const fail = pb.failedExecutions;
  return {
    totalExecutions: t,
    failedExecutions: fail,
    failureRate: t > 0 ? fail / t : 0,
    recentSuccessRate: recentSuccessRate(recent),
    recentWindow: recent.length,
    avgRiskScore: pb.avgRiskScore,
  };
}

/**
 * Eligibility to promote a version: deterministic thresholds on playbook aggregates + recent window.
 */
export async function evaluatePromotionEligibility(params: { playbookId: string; playbookVersionId?: string }): Promise<PromotionEligibility> {
  try {
    await recalculatePlaybookStats(params.playbookId);
    if (params.playbookVersionId) {
      await recalculateVersionStats(params.playbookVersionId);
    }
    const pb = await repo.getMemoryPlaybookById(params.playbookId);
    if (!pb) {
      return { eligible: false, reasons: ["playbook_not_found"], metrics: EMPTY_METRICS };
    }
    const recent = await repo.recentOutcomeStatusesForPlaybook(params.playbookId, PLAYBOOK_RECENT_WINDOW);
    const metrics = metricsForPromotion(pb, recent);
    const reasons: string[] = [];

    if (pb.status !== "ACTIVE" && pb.status !== "DRAFT") {
      reasons.push("playbook_not_promotable_status");
    }
    if (pb.totalExecutions < PLAYBOOK_PROMOTION_MIN_EXECUTIONS) {
      reasons.push(`min_executions_not_met_${PLAYBOOK_PROMOTION_MIN_EXECUTIONS}`);
    }
    if (pb.successfulExecutions < PLAYBOOK_PROMOTION_MIN_SUCCESSES) {
      reasons.push(`min_successes_not_met_${PLAYBOOK_PROMOTION_MIN_SUCCESSES}`);
    }
    if (metrics.successRate < PLAYBOOK_PROMOTION_MIN_SUCCESS_RATE) {
      reasons.push("success_rate_below_min");
    }
    if (pb.avgRiskScore != null && Number.isFinite(pb.avgRiskScore) && pb.avgRiskScore > PLAYBOOK_PROMOTION_MAX_RISK) {
      reasons.push("avg_risk_above_promotion_max");
    }

    return { eligible: reasons.length === 0, reasons, metrics };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    playbookLog.error("evaluatePromotionEligibility", { error: msg });
    return { eligible: false, reasons: [msg], metrics: EMPTY_METRICS };
  }
}

/**
 * Demotion signal: high failure share, low recent success, or risk runaway (deterministic).
 */
export async function evaluateDemotionEligibility(params: { playbookId: string; playbookVersionId?: string }): Promise<DemotionEligibility> {
  try {
    await recalculatePlaybookStats(params.playbookId);
    if (params.playbookVersionId) {
      await recalculateVersionStats(params.playbookVersionId);
    }
    const pb = await repo.getMemoryPlaybookById(params.playbookId);
    if (!pb) {
      return {
        shouldDemote: false,
        reasons: ["playbook_not_found"],
        metrics: {
          totalExecutions: 0,
          failedExecutions: 0,
          failureRate: 0,
          recentSuccessRate: 0,
          recentWindow: 0,
          avgRiskScore: null,
        },
      };
    }
    const recent = await repo.recentOutcomeStatusesForPlaybook(params.playbookId, PLAYBOOK_RECENT_WINDOW);
    const metrics = metricsForDemotion(pb, recent);
    const reasons: string[] = [];

    if (pb.status !== "ACTIVE") {
      return { shouldDemote: false, reasons: [`playbook_status_${pb.status}`], metrics };
    }
    if (pb.totalExecutions < PLAYBOOK_DEMOTION_MIN_EXECUTIONS) {
      return { shouldDemote: false, reasons: ["insufficient_executions_to_judge"], metrics };
    }
    if (metrics.failureRate > PLAYBOOK_DEMOTION_MAX_FAILURE_RATE) {
      reasons.push("failure_rate_above_max");
    }
    if (metrics.recentSuccessRate < PLAYBOOK_DEMOTION_MIN_RECENT_SUCCESS_RATE) {
      reasons.push("recent_success_rate_below_min");
    }
    if (pb.avgRiskScore != null && Number.isFinite(pb.avgRiskScore) && pb.avgRiskScore > PLAYBOOK_DEMOTION_MAX_RISK) {
      reasons.push("avg_risk_above_demotion_max");
    }

    return { shouldDemote: reasons.length > 0, reasons, metrics };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      shouldDemote: false,
      reasons: [msg],
      metrics: {
        totalExecutions: 0,
        failedExecutions: 0,
        failureRate: 0,
        recentSuccessRate: 0,
        recentWindow: 0,
        avgRiskScore: null,
      },
    };
  }
}

export async function applyDemotionIfNeeded(params: { playbookId: string; playbookVersionId?: string; reason?: string }): Promise<SafeResult<{ demoted: boolean }>> {
  try {
    const existing = await repo.getMemoryPlaybookById(params.playbookId);
    if (existing && existing.status !== "ACTIVE") {
      return { ok: true, data: { demoted: false } };
    }
    const check = await evaluateDemotionEligibility({ playbookId: params.playbookId, playbookVersionId: params.playbookVersionId });
    if (!check.shouldDemote) {
      return { ok: true, data: { demoted: false } };
    }
    const reason = [params.reason, ...check.reasons].filter(Boolean).join("; ") || "demotion_thresholds";
    await prisma.$transaction([
      prisma.memoryPlaybook.update({
        where: { id: params.playbookId },
        data: { status: "PAUSED", lastDemotedAt: new Date() },
      }),
      prisma.memoryPlaybookLifecycleEvent.create({
        data: {
          playbookId: params.playbookId,
          playbookVersionId: params.playbookVersionId,
          eventType: "DEMOTED",
          reason,
          payload: check.metrics as object,
        },
      }),
    ]);
    playbookTelemetry.demotedCount += 1;
    playbookLog.warn("applyDemotionIfNeeded", { playbookId: params.playbookId, reason });
    // eslint-disable-next-line no-console
    console.log(PB, "demoted", { playbookId: params.playbookId });
    return { ok: true, data: { demoted: true } };
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    return { ok: false, error: err };
  }
}

export async function promotePlaybookVersion(p: { playbookId: string; playbookVersionId: string; reason?: string }): Promise<SafeResult<{ versionId: string }>> {
  try {
    const v = await prisma.memoryPlaybookVersion.findFirst({ where: { id: p.playbookVersionId, playbookId: p.playbookId } });
    if (!v) {
      return { ok: false, error: "version_not_found" };
    }
    const reason = p.reason?.trim() || "promote_version";

    await prisma.$transaction(async (tx) => {
      await tx.memoryPlaybookVersion.updateMany({ where: { playbookId: p.playbookId }, data: { isActive: false } });
      await tx.memoryPlaybookVersion.update({
        where: { id: p.playbookVersionId },
        data: { isActive: true, promotedAt: new Date() },
      });
      await tx.memoryPlaybook.update({
        where: { id: p.playbookId },
        data: { currentVersionId: p.playbookVersionId, lastPromotedAt: new Date(), status: "ACTIVE" },
      });
      await tx.memoryPlaybookLifecycleEvent.create({
        data: {
          playbookId: p.playbookId,
          playbookVersionId: p.playbookVersionId,
          eventType: "PROMOTED",
          reason,
        },
      });
    });

    playbookTelemetry.promotedCount += 1;
    playbookLog.info("promotePlaybookVersion", { playbookId: p.playbookId, playbookVersionId: p.playbookVersionId });
    // eslint-disable-next-line no-console
    console.log(PB, "promoted", { playbookId: p.playbookId, playbookVersionId: p.playbookVersionId });
    return { ok: true, data: { versionId: p.playbookVersionId } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "promote_failed" };
  }
}

export async function pausePlaybook(p: { playbookId: string; reason?: string }): Promise<SafeResult<{ status: "PAUSED" }>> {
  try {
    const reason = p.reason?.trim() || "pause";
    await prisma.$transaction([
      prisma.memoryPlaybook.update({ where: { id: p.playbookId }, data: { status: "PAUSED" } }),
      prisma.memoryPlaybookLifecycleEvent.create({
        data: { playbookId: p.playbookId, eventType: "PAUSED", reason },
      }),
    ]);
    // eslint-disable-next-line no-console
    console.log(PB, "paused", { playbookId: p.playbookId });
    return { ok: true, data: { status: "PAUSED" } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "pause_failed" };
  }
}

export async function resumePlaybook(p: { playbookId: string; reason?: string }): Promise<SafeResult<{ status: "ACTIVE" }>> {
  try {
    const reason = p.reason?.trim() || "resume";
    await prisma.$transaction([
      prisma.memoryPlaybook.update({ where: { id: p.playbookId }, data: { status: "ACTIVE" } }),
      prisma.memoryPlaybookLifecycleEvent.create({
        data: { playbookId: p.playbookId, eventType: "RESUMED", reason },
      }),
    ]);
    // eslint-disable-next-line no-console
    console.log(PB, "resumed", { playbookId: p.playbookId });
    return { ok: true, data: { status: "ACTIVE" } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "resume_failed" };
  }
}

