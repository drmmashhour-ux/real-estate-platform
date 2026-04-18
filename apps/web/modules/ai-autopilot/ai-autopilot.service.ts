import type { PlatformRole } from "@prisma/client";
import {
  PlatformAutopilotActionStatus,
  PlatformAutopilotRiskClass,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { aiAutopilotV1Flags } from "@/config/feature-flags";
import { runUnifiedDetection } from "./ai-autopilot.engine";
import { getEffectiveAutopilotMode } from "./policies/autopilot-mode.service";
import { executeAutopilotActionIfAllowed } from "./actions/action-executor.service";
import { computeActionFingerprint } from "./core/action-fingerprint.service";
import { findActiveDuplicate } from "./core/action-dedupe.service";
import { computeActionQualityScore } from "./core/action-quality-score.service";
import { assignPriorityBucket, type PriorityBucket } from "./core/action-priority.service";
import { runStaleActionSweep } from "./core/stale-action.service";
import { mergeDedupedAutopilotAction } from "./core/action-refresh.service";
import {
  evaluateAutopilotGuardrails,
  getLastGuardrailSessionStats,
  resetGuardrailSessionStats,
} from "./core/action-guardrail.service";
import type { RankedAction } from "./ai-autopilot.types";

function isAdminRole(role: PlatformRole): boolean {
  return role === "ADMIN" || role === "CONTENT_OPERATOR" || role === "LISTING_OPERATOR";
}

const URGENCY_ORDER: Record<string, number> = {
  DO_NOW: 0,
  DO_TODAY: 1,
  THIS_WEEK: 2,
  LOW_PRIORITY: 3,
  ARCHIVE: 4,
};

const ACTIVE_QUEUE: PlatformAutopilotActionStatus[] = [
  "detected",
  "recommended",
  "pending_approval",
  "approved",
];

export async function persistRankedRun(opts: {
  userId: string;
  role: PlatformRole;
  scopeType: string;
  scopeId: string;
}) {
  if (!aiAutopilotV1Flags.aiAutopilotV1) {
    const mode = await getEffectiveAutopilotMode(opts.scopeType, opts.scopeId);
    return {
      mode,
      createdIds: [] as string[],
      count: 0,
      ranked: [] as RankedAction[],
      signals: [],
      stats: {
        created: 0,
        deduped: 0,
        refreshed: 0,
        archived: 0,
        guardrailRejected: 0,
        guardrailByCode: {} as Record<string, number>,
      },
    };
  }

  resetGuardrailSessionStats();
  const mode = await getEffectiveAutopilotMode(opts.scopeType, opts.scopeId);
  const detection = await runUnifiedDetection({ userId: opts.userId, role: opts.role });
  const { ranked, signals } = detection;

  const createdIds: string[] = [];
  let created = 0;
  let deduped = 0;

  for (const r of ranked) {
    const status: PlatformAutopilotActionStatus = "recommended";
    const fingerprint = computeActionFingerprint({
      domain: r.domain,
      entityType: r.entityType,
      entityId: r.entityId,
      actionType: r.actionType,
      recommendedPayload: r.recommendedPayload,
    });

    const guard = await evaluateAutopilotGuardrails(r, fingerprint);
    if (!guard.allow) {
      continue;
    }

    const dup = await findActiveDuplicate(fingerprint);
    const quality = computeActionQualityScore(r, {
      duplicateRefresh: Boolean(dup),
      existingDuplicateCount: dup ? dup.duplicateCount + 1 : undefined,
      existing: dup ?? undefined,
    });
    const priorityBucket = assignPriorityBucket(r, quality) as PriorityBucket;

    if (dup) {
      await mergeDedupedAutopilotAction({
        dup,
        ranked: r,
        quality,
        priorityBucket,
      });
      deduped += 1;
      createdIds.push(dup.id);
    } else {
      const now = new Date();
      const row = await prisma.platformAutopilotAction.create({
        data: {
          fingerprint,
          domain: r.domain,
          entityType: r.entityType,
          entityId: r.entityId,
          actionType: r.actionType,
          title: r.title,
          summary: r.summary,
          severity: r.severity,
          riskLevel: r.riskLevel,
          status,
          recommendedPayload: r.recommendedPayload as object,
          reasons: r.reasons as object,
          subjectUserId: r.subjectUserId,
          audience: r.audience,
          qualityScore: quality.qualityScore,
          valueScore: quality.valueScore,
          noisePenalty: quality.noisePenalty,
          priorityBucket,
          duplicateCount: 0,
          lastDetectedAt: now,
          lastRefreshedAt: now,
        },
      });
      created += 1;
      createdIds.push(row.id);
    }
  }

  const stale = await runStaleActionSweep({ viewerId: opts.userId, role: opts.role });
  const gs = getLastGuardrailSessionStats();

  return {
    mode,
    createdIds,
    count: createdIds.length,
    ranked,
    signals,
    stats: {
      created,
      deduped,
      refreshed: deduped,
      archived: stale.archived + stale.expired,
      guardrailRejected: gs.rejected,
      guardrailByCode: gs.byCode,
    },
  };
}

export type AutopilotActionSort = "quality" | "urgency" | "newest" | "domain";

export async function listActionsForViewer(opts: {
  viewerId: string;
  role: PlatformRole;
  sort?: AutopilotActionSort;
}) {
  const admin = isAdminRole(opts.role);
  const sort = opts.sort ?? "newest";
  const base = await prisma.platformAutopilotAction.findMany({
    where: admin ? {} : { subjectUserId: opts.viewerId },
    take: sort === "newest" ? 150 : 300,
    orderBy: { createdAt: "desc" },
  });

  if (sort === "newest") return base;

  if (sort === "quality") {
    return [...base].sort((a, b) => (b.qualityScore ?? -1) - (a.qualityScore ?? -1));
  }

  if (sort === "domain") {
    return [...base].sort((a, b) => a.domain.localeCompare(b.domain) || (b.createdAt.getTime() - a.createdAt.getTime()));
  }

  return [...base].sort((a, b) => {
    const pa = a.priorityBucket ? URGENCY_ORDER[a.priorityBucket] ?? 99 : 99;
    const pb = b.priorityBucket ? URGENCY_ORDER[b.priorityBucket] ?? 99 : 99;
    if (pa !== pb) return pa - pb;
    return (b.qualityScore ?? 0) - (a.qualityScore ?? 0);
  });
}

export async function getSummary(opts: { viewerId: string; role: PlatformRole }) {
  const admin = isAdminRole(opts.role);
  const rows = await prisma.platformAutopilotAction.findMany({
    where: admin ? {} : { subjectUserId: opts.viewerId },
    take: 500,
  });
  const pending = rows.filter((r) => r.status === "pending_approval" || r.status === "recommended").length;

  const totalActiveActions = rows.filter((r) => ACTIVE_QUEUE.includes(r.status)).length;

  const duplicateCollapsedCount = rows.reduce((s, r) => s + (r.duplicateCount > 0 ? r.duplicateCount : 0), 0);

  const staleActions = rows.filter((r) => r.status === "archived" || r.status === "expired").length;

  const topQualityActions = [...rows]
    .filter((r) => r.qualityScore != null)
    .sort((a, b) => (b.qualityScore ?? 0) - (a.qualityScore ?? 0))
    .slice(0, 5)
    .map((r) => ({
      id: r.id,
      title: r.title,
      qualityScore: r.qualityScore,
      priorityBucket: r.priorityBucket,
      duplicateCount: r.duplicateCount,
    }));

  return {
    total: rows.length,
    totalActiveActions,
    pendingApproval: pending,
    byStatus: Object.fromEntries(
      [...new Set(rows.map((r) => r.status))].map((s) => [s, rows.filter((x) => x.status === s).length]),
    ),
    duplicateCollapsedCount,
    staleActions,
    topQualityActions,
  };
}

export async function approveAction(opts: { actionId: string; actorUserId: string }) {
  await prisma.platformAutopilotAction.update({
    where: { id: opts.actionId },
    data: { status: "approved", approvedById: opts.actorUserId },
  });
  await prisma.platformAutopilotDecision.create({
    data: {
      actionId: opts.actionId,
      decisionType: "approved",
      actorUserId: opts.actorUserId,
      actorType: "user",
    },
  });
}

export async function rejectAction(opts: { actionId: string; actorUserId: string; notes?: string }) {
  await prisma.platformAutopilotAction.update({
    where: { id: opts.actionId },
    data: { status: "rejected" },
  });
  await prisma.platformAutopilotDecision.create({
    data: {
      actionId: opts.actionId,
      decisionType: "rejected",
      actorUserId: opts.actorUserId,
      actorType: "user",
      notes: opts.notes ? { text: opts.notes } : undefined,
    },
  });
}

export async function guardedExecute(opts: { actionId: string; actorUserId: string; role: PlatformRole }) {
  if (!aiAutopilotV1Flags.aiAutopilotV1) {
    return { ok: false as const, reason: "disabled" };
  }
  const row = await prisma.platformAutopilotAction.findUnique({ where: { id: opts.actionId } });
  if (!row) return { ok: false as const, reason: "not_found" };
  if (row.subjectUserId && row.subjectUserId !== opts.actorUserId && !isAdminRole(opts.role)) {
    return { ok: false as const, reason: "forbidden" };
  }
  const mode = await getEffectiveAutopilotMode("user", opts.actorUserId);
  return executeAutopilotActionIfAllowed({
    actionId: row.id,
    mode,
    risk: row.riskLevel as PlatformAutopilotRiskClass,
    actorUserId: opts.actorUserId,
  });
}
