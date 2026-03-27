import type { AggregatedDealStats, DealInsights } from "../domain/aggregates";

/**
 * Deterministic insight strings from workspace-aggregated stats only (no PII, no cross-org data).
 */
export function generateDealInsights(stats: AggregatedDealStats): DealInsights {
  const successPatterns: string[] = [];
  const riskFactors: string[] = [];
  const optimalStrategies: string[] = [];

  const terminal = stats.won + stats.lost + stats.canceled;
  const winRate = terminal > 0 ? stats.won / terminal : 0;

  if (terminal === 0) {
    successPatterns.push("Record closed outcomes to unlock pattern detection.");
    riskFactors.push("Insufficient outcome history — pipeline risk is unknown at aggregate level.");
    optimalStrategies.push("Close first deals with documented milestones to seed the learning loop.");
    return { successPatterns, riskFactors, optimalStrategies, dataScope: "workspace_aggregates_only" };
  }

  if (winRate >= 0.55) {
    successPatterns.push("Above-median win rate vs mixed outcomes — double down on current qualification criteria.");
  } else if (winRate >= 0.35) {
    successPatterns.push("Balanced win/loss mix — suitable for A/B testing on follow-up cadence.");
  } else {
    riskFactors.push("Win rate below typical balanced pipeline — review pricing and inspection friction.");
  }

  if (stats.avgDaysToOutcome != null && stats.avgDaysToOutcome > 90) {
    riskFactors.push("Long average cycle time — consider milestone SLAs and document readiness checks.");
  } else if (stats.avgDaysToOutcome != null && stats.avgDaysToOutcome < 30) {
    successPatterns.push("Short cycle times — replicate playbook for similar listing types.");
  }

  if (stats.documentRateWhenWon != null && stats.documentRateWhenWon < 0.5) {
    riskFactors.push("Wins correlate weakly with document completeness — tighten file checklist before offer.");
  } else if (stats.documentRateWhenWon != null && stats.documentRateWhenWon >= 0.75) {
    successPatterns.push("Strong documentation association with wins — keep vault discipline.");
  }

  if (stats.bypassFlagRate > 0.05) {
    riskFactors.push("Elevated compliance bypass flags — prioritize human review on new files.");
  }

  optimalStrategies.push("Benchmark brokers internally; coach low success-rate producers with anonymized aggregates.");
  optimalStrategies.push("Log every terminal outcome to tighten recommendations over time (workspace-scoped only).");

  if (stats.activeBrokersInHistory >= 3) {
    successPatterns.push("Multi-producer data — safe to compare relative velocity without exposing other workspaces.");
  }

  return { successPatterns, riskFactors, optimalStrategies, dataScope: "workspace_aggregates_only" };
}
