import { prisma } from "@/lib/db";

export type RegressionCheck = {
  decisionId: string;
  shouldRollback: boolean;
  reason: string;
  metrics: Record<string, number | null>;
};

/**
 * Compare post-execute snapshots to detect material regression (policy-bound rollback suggestion).
 */
export async function evaluateDecisionRegression(decisionId: string): Promise<RegressionCheck> {
  const d = await prisma.ceoDecision.findUnique({ where: { id: decisionId } });
  if (!d || d.status !== "EXECUTED" || !d.resultJson) {
    return {
      decisionId,
      shouldRollback: false,
      reason: "not_executed_or_missing_result",
      metrics: {},
    };
  }

  const result = d.resultJson as { baselineConversion?: number; postConversion?: number };
  const base = result.baselineConversion ?? null;
  const post = result.postConversion ?? null;

  let shouldRollback = false;
  let reason = "ok";

  if (base != null && post != null && base > 0.05 && post < base * 0.85) {
    shouldRollback = true;
    reason = "conversion_regression_gt_15pct";
  }

  return {
    decisionId,
    shouldRollback,
    reason,
    metrics: { baselineConversion: base, postConversion: post },
  };
}

export async function listRecentExecutions(take = 50) {
  return prisma.ceoDecision.findMany({
    where: { status: "EXECUTED" },
    orderBy: { executedAt: "desc" },
    take,
    select: {
      id: true,
      domain: true,
      title: true,
      summary: true,
      confidence: true,
      impactEstimate: true,
      resultJson: true,
      executedAt: true,
      createdAt: true,
    },
  });
}

export function mergeMonitoringSummary(
  rows: Awaited<ReturnType<typeof listRecentExecutions>>
): {
  executed: number;
  withOutcome: number;
  avgConfidence: number | null;
} {
  const conf = rows.map((r) => r.confidence).filter((c): c is number => c != null && Number.isFinite(c));
  const withOutcome = rows.filter((r) => r.resultJson != null).length;
  return {
    executed: rows.length,
    withOutcome,
    avgConfidence: conf.length ? conf.reduce((a, b) => a + b, 0) / conf.length : null,
  };
}
