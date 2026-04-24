import { prisma } from "@/lib/db";
import { getRolloutDegradeThreshold } from "./rollout.constants";
import type { RolloutMetricsBundle } from "./rollout-metrics.service";

export type RolloutVerdict = "IMPROVE" | "NEUTRAL" | "DEGRADE";

export type RolloutEvaluationResult = {
  improvementPct: number;
  degradationPct: number;
  verdict: RolloutVerdict;
};

function compositeScore(m: RolloutMetricsBundle): number {
  return (
    m.conversionRate * 0.35 +
    m.dealSuccessRate * 0.35 +
    m.engagementScore * 0.2 +
    Math.max(0, 1 + m.revenuePerUser) * 0.1
  );
}

/**
 * Compare earliest vs latest snapshot composite for this execution.
 */
export async function evaluateRollout(executionId: string): Promise<RolloutEvaluationResult> {
  const snaps = await prisma.rolloutMetricSnapshot.findMany({
    where: { executionId },
    orderBy: { timestamp: "asc" },
  });

  if (snaps.length < 2) {
    return { improvementPct: 0, degradationPct: 0, verdict: "NEUTRAL" };
  }

  const first = snaps[0]!.metricsJson as RolloutMetricsBundle;
  const last = snaps[snaps.length - 1]!.metricsJson as RolloutMetricsBundle;
  const sa = compositeScore(first);
  const sb = compositeScore(last);
  const denom = Math.max(1e-9, sa);
  const delta = (sb - sa) / denom;
  const threshold = getRolloutDegradeThreshold();

  if (delta > 0.02) {
    return { improvementPct: delta * 100, degradationPct: 0, verdict: "IMPROVE" };
  }
  if (delta < -threshold) {
    return { improvementPct: 0, degradationPct: -delta * 100, verdict: "DEGRADE" };
  }
  return { improvementPct: 0, degradationPct: 0, verdict: "NEUTRAL" };
}
