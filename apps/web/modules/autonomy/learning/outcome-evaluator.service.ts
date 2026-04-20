import { prisma } from "@/lib/db";
import { loadObservedMetrics } from "./outcome-metrics.service";
import { evaluateOutcome } from "./outcome-scoring.service";
import { getOrCreateRuleWeight, updateRuleWeight } from "./rule-weight.service";
import type { BaselineMetrics } from "./learning.types";
import { updateContextualStatsFromOutcome } from "@/modules/autonomy/contextual/contextual-learning-update.service";

function parseBaseline(raw: unknown): BaselineMetrics {
  if (!raw || typeof raw !== "object") {
    return {
      grossRevenue: 0,
      occupancyRate: 0,
      bookingCount: 0,
      adr: 0,
      revpar: 0,
    };
  }
  const b = raw as Record<string, unknown>;
  return {
    grossRevenue: Number(b.grossRevenue ?? 0),
    occupancyRate: Number(b.occupancyRate ?? 0),
    bookingCount: Number(b.bookingCount ?? 0),
    adr: Number(b.adr ?? 0),
    revpar: Number(b.revpar ?? 0),
  };
}

export async function evaluateActionOutcome(actionId: string) {
  const action = await prisma.autonomyAction.findUnique({
    where: { id: actionId },
  });

  if (!action) {
    throw new Error("Action not found");
  }

  if (!action.learningEligible) {
    return { skipped: true as const, reason: "Action not learning eligible" };
  }

  const existingOutcome = await prisma.autonomyOutcome.findUnique({
    where: { actionId },
  });

  if (existingOutcome) {
    return { skipped: true as const, reason: "Outcome already evaluated" };
  }

  const cfg = await prisma.autonomyConfig.findUnique({
    where: {
      scopeType_scopeId: {
        scopeType: action.scopeType,
        scopeId: action.scopeId,
      },
    },
    select: { learningWindowDays: true },
  });

  const outcomeWindowDays = cfg?.learningWindowDays ?? 7;

  const baseline = parseBaseline(action.baselineMetricsJson ?? undefined);
  const observed = await loadObservedMetrics(action.scopeType, action.scopeId);

  const scored = evaluateOutcome(action.domain, action.actionType, baseline, observed);

  await prisma.autonomyLearningLog.create({
    data: {
      scopeType: action.scopeType,
      scopeId: action.scopeId,
      actionId: action.id,
      eventType: "reward_scored",
      message: "Deterministic reward computed from observed BNHub metrics vs stored baseline.",
      meta: {
        rewardScore: scored.rewardScore,
        outcomeLabel: scored.outcomeLabel,
        deltas: scored.deltas,
      },
    },
  });

  const outcome = await prisma.autonomyOutcome.create({
    data: {
      actionId: action.id,
      scopeType: action.scopeType,
      scopeId: action.scopeId,
      baselineRevenue: baseline.grossRevenue,
      baselineOccupancy: baseline.occupancyRate,
      baselineBookings: baseline.bookingCount,
      baselineAdr: baseline.adr,
      baselineRevpar: baseline.revpar,

      observedRevenue: observed.grossRevenue,
      observedOccupancy: observed.occupancyRate,
      observedBookings: observed.bookingCount,
      observedAdr: observed.adr,
      observedRevpar: observed.revpar,

      revenueDelta: scored.deltas.revenueDelta,
      occupancyDelta: scored.deltas.occupancyDelta,
      bookingDelta: scored.deltas.bookingDelta,
      adrDelta: scored.deltas.adrDelta,
      revparDelta: scored.deltas.revparDelta,

      rewardScore: scored.rewardScore,
      outcomeLabel: scored.outcomeLabel,
      outcomeWindowDays,
      notes: `Outcome-based adjustment: Self-Learning Autonomy · deterministic · ${outcomeWindowDays}-day window vs current ${action.scopeType} KPIs.`,
    },
  });

  await prisma.autonomyLearningLog.create({
    data: {
      scopeType: action.scopeType,
      scopeId: action.scopeId,
      actionId: action.id,
      eventType: "outcome_recorded",
      message: "Autonomy outcome recorded.",
      meta: {
        rewardScore: scored.rewardScore,
        outcomeLabel: scored.outcomeLabel,
      },
    },
  });

  if (action.signalKey) {
    const ruleWeight = await getOrCreateRuleWeight({
      scopeType: action.scopeType,
      scopeId: action.scopeId,
      domain: action.domain,
      signalKey: action.signalKey,
      actionType: action.actionType,
    });

    const weightResult = await updateRuleWeight(ruleWeight.id, Number(scored.rewardScore || 0));

    if (weightResult.applied) {
      await prisma.autonomyLearningLog.create({
        data: {
          scopeType: action.scopeType,
          scopeId: action.scopeId,
          actionId: action.id,
          ruleWeightId: weightResult.row.id,
          eventType: "weight_updated",
          message: "Rule preference weight updated from observed outcome (bounded; safety limits unchanged).",
          meta: {
            rewardScore: scored.rewardScore,
            newWeight: weightResult.row.weight,
            successCount: weightResult.row.successCount,
            failureCount: weightResult.row.failureCount,
          },
        },
      });
    }
  }

  const contextFeatures =
    action.contextFeaturesJson && typeof action.contextFeaturesJson === "object" && !Array.isArray(action.contextFeaturesJson)
      ? (action.contextFeaturesJson as Record<string, string>)
      : {};

  if (action.signalKey && Object.keys(contextFeatures).length > 0) {
    await updateContextualStatsFromOutcome({
      scopeType: action.scopeType,
      scopeId: action.scopeId,
      domain: action.domain,
      signalKey: action.signalKey,
      actionType: action.actionType,
      contextFeatures,
      rewardScore: Number(scored.rewardScore ?? 0),
    });

    await prisma.autonomyLearningLog.create({
      data: {
        scopeType: action.scopeType,
        scopeId: action.scopeId,
        actionId: action.id,
        eventType: "context_stats_updated",
        message: "Contextual stats updated from outcome (bucket-level; not causal inference).",
        meta: {
          actionType: action.actionType,
          signalKey: action.signalKey,
          rewardScore: scored.rewardScore,
          contextFeatures,
        },
      },
    });
  }

  return {
    success: true as const,
    outcome,
  };
}
