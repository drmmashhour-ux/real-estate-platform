import type { BrainLearningSource, BrainOutcomeRecord, BrainOutcomeType } from "./brain-v2.types";

function hasMetricCoverage(m: Record<string, unknown> | null | undefined): boolean {
  return !!(m && typeof m === "object" && Object.keys(m).length > 0);
}

export function classifyDecisionOutcome(input: {
  decisionId: string;
  source: BrainLearningSource;
  entityType: string;
  entityId?: string | null;
  actionType: string;
  beforeMetrics?: Record<string, unknown> | null;
  afterMetrics?: Record<string, unknown> | null;
}): BrainOutcomeRecord {
  if (!hasMetricCoverage(input.beforeMetrics) || !hasMetricCoverage(input.afterMetrics)) {
    return {
      decisionId: input.decisionId,
      source: input.source,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      actionType: input.actionType,
      outcomeType: "INSUFFICIENT_DATA",
      outcomeScore: 0,
      observedMetrics: {
        before: input.beforeMetrics ?? null,
        after: input.afterMetrics ?? null,
      },
      reason: "Insufficient before/after data to evaluate outcome.",
      createdAt: new Date().toISOString(),
    };
  }

  const beforeConversion = Number(input.beforeMetrics?.conversionRate ?? 0);
  const afterConversion = Number(input.afterMetrics?.conversionRate ?? 0);
  const beforeCtr = Number(input.beforeMetrics?.ctr ?? 0);
  const afterCtr = Number(input.afterMetrics?.ctr ?? 0);
  const beforeProfit = Number(input.beforeMetrics?.profitPerLead ?? 0);
  const afterProfit = Number(input.afterMetrics?.profitPerLead ?? 0);

  const deltas = [
    afterConversion - beforeConversion,
    afterCtr - beforeCtr,
    afterProfit - beforeProfit,
  ].filter((x) => Number.isFinite(x));

  let outcomeScore = 0;
  if (deltas.length > 0) {
    outcomeScore = deltas.reduce((sum, value) => sum + value, 0) / deltas.length;
  }

  let outcomeType: BrainOutcomeType = "INSUFFICIENT_DATA";
  let reason = "Insufficient before/after data to evaluate outcome.";

  if (deltas.length > 0) {
    if (outcomeScore > 0.02) {
      outcomeType = "POSITIVE";
      reason = "Observed metrics improved after the decision.";
    } else if (outcomeScore < -0.02) {
      outcomeType = "NEGATIVE";
      reason = "Observed metrics declined after the decision.";
    } else {
      outcomeType = "NEUTRAL";
      reason = "Observed metrics remained materially stable.";
    }
  }

  return {
    decisionId: input.decisionId,
    source: input.source,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    actionType: input.actionType,
    outcomeType,
    outcomeScore: Number(outcomeScore.toFixed(4)),
    observedMetrics: {
      before: input.beforeMetrics ?? null,
      after: input.afterMetrics ?? null,
    },
    reason,
    createdAt: new Date().toISOString(),
  };
}
