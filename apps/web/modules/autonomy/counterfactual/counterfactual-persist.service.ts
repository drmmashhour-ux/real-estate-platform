import { prisma } from "@/lib/db";
import { runCounterfactualEvaluation } from "./counterfactual-engine.service";

export async function evaluateAndStoreCounterfactual(actionId: string) {
  const action = await prisma.autonomyAction.findUnique({
    where: { id: actionId },
  });

  if (!action) {
    throw new Error("Action not found");
  }

  const existing = await prisma.counterfactualEvaluation.findUnique({
    where: { actionId },
  });

  if (existing) {
    return { skipped: true as const, reason: "Counterfactual already evaluated", evaluation: existing };
  }

  const { result, matchLogs } = await runCounterfactualEvaluation(action);

  const row = await prisma.counterfactualEvaluation.create({
    data: {
      actionId: action.id,
      scopeType: action.scopeType,
      scopeId: action.scopeId,
      baselineWindowDays: 14,
      outcomeWindowDays: 7,

      observedRevenue: result.observed.revenue,
      observedOccupancy: result.observed.occupancy,
      observedBookings: Math.round(result.observed.bookings),
      observedAdr: result.observed.adr,
      observedRevpar: result.observed.revpar,

      expectedRevenue: result.expected.revenue,
      expectedOccupancy: result.expected.occupancy,
      expectedBookings: result.expected.bookings,
      expectedAdr: result.expected.adr,
      expectedRevpar: result.expected.revpar,

      upliftRevenue: result.uplift.revenue,
      upliftOccupancy: result.uplift.occupancy,
      upliftBookings: result.uplift.bookings,
      upliftAdr: result.uplift.adr,
      upliftRevpar: result.uplift.revpar,

      upliftScore: result.upliftScore,
      confidenceScore: result.confidenceScore,
      estimateMethod: result.estimateMethod,
      notes:
        "Counterfactual estimate (not causal proof): deterministic blend of internal trend projection and contextual-action-stat matches.",
    },
  });

  for (const log of matchLogs) {
    await prisma.counterfactualMatchLog.create({
      data: {
        actionId: action.id,
        featureKey: log.featureKey,
        featureValue: log.featureValue,
        matchedCount: log.matchedCount,
        averageReward: log.averageReward,
      },
    });
  }

  await prisma.upliftLearningLog.create({
    data: {
      actionId: action.id,
      scopeType: action.scopeType,
      scopeId: action.scopeId,
      eventType: "counterfactual_scored",
      message: "Counterfactual evaluation stored (internal-data uplift estimate).",
      meta: {
        upliftScore: result.upliftScore,
        confidenceScore: result.confidenceScore,
        estimateMethod: result.estimateMethod,
      },
    },
  });

  return {
    success: true as const,
    evaluation: row,
  };
}
