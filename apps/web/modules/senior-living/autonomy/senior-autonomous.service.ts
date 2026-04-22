/**
 * Human-supervised autonomy — persistence, execution guardrails, reversibility hooks.
 */
import type { SeniorAutonomyMode } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logSeniorAutonomous } from "@/lib/senior-autonomous/log";
import {
  getAreaInsights,
  getHotLeads,
  getOperatorSummaries,
  getPricingRules,
  getSeniorCommandKpis,
  getStuckDeals,
} from "@/modules/senior-living/command/senior-command.service";
import { evaluateMarketplaceState } from "@/modules/senior-living/ai/senior-autonomous.engine";
import type { AutonomousActionProposal } from "@/modules/senior-living/ai/senior-autonomous.types";

const SETTINGS_ID = "senior_autonomy_global";

export async function getOrCreateAutonomySettings() {
  return prisma.seniorAutonomySettings.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID, mode: "OFF", paused: false },
    update: {},
  });
}

export async function setAutonomyPaused(paused: boolean): Promise<void> {
  await prisma.seniorAutonomySettings.update({
    where: { id: SETTINGS_ID },
    data: { paused },
  });
  logSeniorAutonomous("[senior-autonomous]", paused ? "pause_on" : "pause_off", {});
}

export async function setAutonomyMode(mode: SeniorAutonomyMode): Promise<void> {
  await prisma.seniorAutonomySettings.update({
    where: { id: SETTINGS_ID },
    data: { mode },
  });
  logSeniorAutonomous("[senior-autonomous]", "mode_change", { mode });
}

export async function buildMarketplaceSnapshot() {
  const [kpis, operators, areas, hotLeads, stuckDeals, pricingRules] = await Promise.all([
    getSeniorCommandKpis(),
    getOperatorSummaries(),
    getAreaInsights(),
    getHotLeads(24),
    getStuckDeals(24),
    getPricingRules(),
  ]);
  return {
    kpis,
    operators,
    areas,
    hotLeads,
    stuckDeals,
    pricingRules,
  };
}

function shouldAutoExecute(mode: SeniorAutonomyMode, risk: string, actionType: string): boolean {
  if (mode !== "SAFE_AUTOPILOT") return false;
  if (risk !== "LOW") return false;
  if (actionType === "INCREASE_PRICE" || actionType === "DECREASE_PRICE") return false;
  if (actionType === "REDUCE_OPERATOR_VISIBILITY") return false;
  if (actionType === "BOOST_OPERATOR") return false;
  if (actionType === "REASSIGN_LEAD") return false;
  return actionType === "PRIORITIZE_LEAD" || actionType === "TRIGGER_FOLLOWUP";
}

/** Evaluate + persist proposals; SAFE_AUTOPILOT auto-runs LOW-risk safe ops. */
export async function evaluateAndPersistActions(): Promise<{
  settings: Awaited<ReturnType<typeof getOrCreateAutonomySettings>>;
  proposals: AutonomousActionProposal[];
  executedIds: string[];
}> {
  const settings = await getOrCreateAutonomySettings();
  const executedIds: string[] = [];

  if (settings.paused || settings.mode === "OFF") {
    logSeniorAutonomous("[senior-autonomous]", "evaluate_skipped", {
      paused: settings.paused,
      mode: settings.mode,
    });
    return { settings, proposals: [], executedIds };
  }

  const snapshot = await buildMarketplaceSnapshot();
  const proposals = evaluateMarketplaceState(snapshot);

  for (const p of proposals) {
    const row = await prisma.autonomousActionLog.create({
      data: {
        actionType: p.actionType,
        payload: p.payload as object,
        riskLevel: p.riskLevel,
        status: "PENDING",
        reason: p.reason,
        confidence: p.confidence,
        impactConversionPct: p.impactConversionPct ?? undefined,
        impactRevenuePct: p.impactRevenuePct ?? undefined,
      },
    });
    logSeniorAutonomous("[action-created]", row.id.slice(0, 10), {
      type: p.actionType,
      risk: p.riskLevel,
    });

    const auto =
      settings.mode === "SAFE_AUTOPILOT" &&
      shouldAutoExecute(settings.mode, p.riskLevel, p.actionType);

    const fullApprovalQueue = settings.mode === "FULL_AUTOPILOT_APPROVAL";
    const shouldRun = auto && !fullApprovalQueue;

    if (shouldRun) {
      try {
        await executeAutonomousLogById(row.id);
        executedIds.push(row.id);
      } catch (e) {
        await prisma.autonomousActionLog.update({
          where: { id: row.id },
          data: {
            status: "PENDING",
            executedResultJson: {
              error: e instanceof Error ? e.message : "execute_failed",
            } as object,
          },
        });
      }
    } else if (settings.mode === "ASSIST") {
      await prisma.autonomousActionLog.update({
        where: { id: row.id },
        data: { status: "PENDING" },
      });
    }
  }

  return { settings, proposals, executedIds };
}

export async function listAutonomyActions(opts?: { pendingOnly?: boolean }) {
  return prisma.autonomousActionLog.findMany({
    where: opts?.pendingOnly ? { status: "PENDING" } : undefined,
    orderBy: { createdAt: "desc" },
    take: opts?.pendingOnly ? 80 : 60,
  });
}

export async function approveAutonomousAction(logId: string, userId: string): Promise<void> {
  const row = await prisma.autonomousActionLog.findUnique({ where: { id: logId } });
  if (!row || row.status !== "PENDING") throw new Error("Invalid action");

  await prisma.autonomousActionLog.update({
    where: { id: logId },
    data: {
      status: "APPROVED",
      reviewedAt: new Date(),
      reviewedByUserId: userId,
    },
  });
  logSeniorAutonomous("[action-approved]", logId.slice(0, 10), { user: userId.slice(0, 8) });

  try {
    await executeAutonomousLogById(logId);
    await recordLearning(logId, "approved");
  } catch (e) {
    await prisma.autonomousActionLog.update({
      where: { id: logId },
      data: {
        status: "PENDING",
        executedResultJson: {
          approveFailed: true,
          error: e instanceof Error ? e.message : "execute_failed",
        } as object,
      },
    });
    throw e;
  }
}

export async function rejectAutonomousAction(logId: string, userId: string, reason: string): Promise<void> {
  await prisma.autonomousActionLog.update({
    where: { id: logId },
    data: {
      status: "REJECTED",
      reviewedAt: new Date(),
      reviewedByUserId: userId,
      rejectionReason: reason.slice(0, 2000),
    },
  });
  logSeniorAutonomous("[action-rejected]", logId.slice(0, 10), {});
  await recordLearning(logId, "rejected", reason);
}

async function recordLearning(logId: string, outcome: string, detail?: string): Promise<void> {
  await prisma.autonomousActionLog.update({
    where: { id: logId },
    data: {
      learningOutcomeJson: { outcome, detail: detail ?? null, at: new Date().toISOString() } as object,
    },
  });
}

export async function executeAutonomousLogById(logId: string): Promise<void> {
  const row = await prisma.autonomousActionLog.findUnique({ where: { id: logId } });
  if (!row) throw new Error("Not found");

  const payload = row.payload as Record<string, unknown>;
  const type = row.actionType;

  const settings = await getOrCreateAutonomySettings();
  if (settings.paused) {
    throw new Error("Autonomy is paused — no executions until unpause.");
  }

  switch (type) {
    case "BOOST_OPERATOR":
    case "REDUCE_OPERATOR_VISIBILITY": {
      const operatorId = String(payload.operatorId ?? "");
      const delta = typeof payload.delta === "number" ? payload.delta : type === "BOOST_OPERATOR" ? 1 : -1;
      await applyOperatorBoost(operatorId, delta);
      break;
    }
    case "INCREASE_PRICE":
    case "DECREASE_PRICE": {
      const reversal = await applyPricingAdjustment(payload, type === "INCREASE_PRICE");
      await prisma.autonomousActionLog.update({
        where: { id: logId },
        data: { reversalPayload: reversal as object },
      });
      break;
    }
    case "PRIORITIZE_LEAD":
    case "TRIGGER_FOLLOWUP": {
      await prisma.seniorLearningEvent.create({
        data: {
          leadId: String(payload.leadId ?? ""),
          eventType: type === "PRIORITIZE_LEAD" ? "AUTONOMY_PRIORITIZE" : "AUTONOMY_FOLLOWUP",
          metadataJson: { autonomousLogId: logId } as object,
        },
      });
      break;
    }
    case "FLAG_RISK":
    case "SUGGEST_EXPANSION": {
      break;
    }
    case "REASSIGN_LEAD": {
      throw new Error("Reassignment requires explicit routing rules — use manual CRM.");
    }
    default:
      throw new Error(`Unsupported action ${type}`);
  }

  await prisma.autonomousActionLog.update({
    where: { id: logId },
    data: {
      status: "EXECUTED",
      executedAt: new Date(),
      executedResultJson: { ok: true } as object,
    },
  });
  logSeniorAutonomous("[action-executed]", logId.slice(0, 10), { type });
}

/** Roll back pricing adjustment using stored reversalPayload (human-triggered). */
export async function rollbackPricingFromLog(logId: string): Promise<void> {
  const row = await prisma.autonomousActionLog.findUnique({ where: { id: logId } });
  if (!row?.reversalPayload || typeof row.reversalPayload !== "object") {
    throw new Error("No reversal data");
  }
  const rev = row.reversalPayload as Record<string, unknown>;
  const ruleId = String(rev.pricingRuleId ?? "");
  const d = rev.rollbackDemandFactor;
  const q = rev.rollbackQualityFactor;
  if (!ruleId || typeof d !== "number" || typeof q !== "number") throw new Error("Invalid reversal");

  await prisma.seniorPricingRule.update({
    where: { id: ruleId },
    data: { demandFactor: d, qualityFactor: q },
  });
  logSeniorAutonomous("[action-rolled-back]", logId.slice(0, 10), { ruleId: ruleId.slice(0, 8) });
}

async function applyOperatorBoost(operatorId: string, delta: number): Promise<void> {
  const residences = await prisma.seniorResidence.findMany({
    where: { operatorId },
    select: { id: true, rankBoostPoints: true },
    take: 80,
  });
  if (residences.length === 0) return;

  /** Safety: never push every listing to floor — keep max reduction soft at -4 minimum per residence. */
  const minFloor = delta < 0 ? -4 : -5;
  const maxCeil = 5;

  for (const r of residences) {
    const next = Math.max(minFloor, Math.min(maxCeil, (r.rankBoostPoints ?? 0) + delta));
    await prisma.seniorResidence.update({
      where: { id: r.id },
      data: { rankBoostPoints: next },
    });
  }
}

const MAX_PRICE_FACTOR_DELTA = 0.25;

async function applyPricingAdjustment(
  payload: Record<string, unknown>,
  increase: boolean,
): Promise<Record<string, unknown>> {
  const ruleId = String(payload.pricingRuleId ?? "");
  if (!ruleId) throw new Error("pricingRuleId required");

  const rule = await prisma.seniorPricingRule.findUnique({ where: { id: ruleId } });
  if (!rule) throw new Error("Pricing rule not found");

  const dm =
    typeof payload.demandFactorMultiplier === "number" ? payload.demandFactorMultiplier
    : increase ? 1.06
    : 0.94;
  const qm =
    typeof payload.qualityFactorMultiplier === "number" ? payload.qualityFactorMultiplier
    : increase ? 1.02
    : 0.98;

  let nextDemand = rule.demandFactor * dm;
  let nextQuality = rule.qualityFactor * qm;

  const prevProduct = rule.demandFactor * rule.qualityFactor;
  const nextProduct = nextDemand * nextQuality;
  const ratio = nextProduct / prevProduct;
  if (ratio > 1 + MAX_PRICE_FACTOR_DELTA || ratio < 1 - MAX_PRICE_FACTOR_DELTA) {
    const capped = increase ? 1 + MAX_PRICE_FACTOR_DELTA : 1 - MAX_PRICE_FACTOR_DELTA;
    const scale = Math.sqrt((prevProduct * capped) / nextProduct);
    nextDemand *= scale;
    nextQuality *= scale;
  }

  await prisma.seniorPricingRule.update({
    where: { id: ruleId },
    data: {
      demandFactor: Math.round(nextDemand * 10000) / 10000,
      qualityFactor: Math.round(nextQuality * 10000) / 10000,
    },
  });

  return {
    pricingRuleId: ruleId,
    rollbackDemandFactor: rule.demandFactor,
    rollbackQualityFactor: rule.qualityFactor,
  };
}
