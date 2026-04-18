import { prisma } from "@/lib/db";

/** Require more outcomes before we suppress or boost — reduces flip-flop on thin histories. */
const MIN_SAMPLES = 8;

const SUCCESS_OUTCOMES = new Set(["approved", "applied", "success"]);

export type RecommendationRankingResult = {
  show: boolean;
  reason: "low performance suppressed" | "high performance boosted" | "normal" | "insufficient_data";
};

/**
 * Simple per-host + rule ranking from AiOutcomeSignal (no safety/approval changes).
 * Suppresses when historical success rate is low; surfaces boost hint for higher confidence only.
 */
export async function shouldShowRecommendation(
  ruleName: string,
  hostId: string
): Promise<RecommendationRankingResult> {
  const rows = await prisma.aiOutcomeSignal.findMany({
    where: { hostId, ruleName },
    select: { outcomeType: true },
  });

  let successes = 0;
  let failures = 0;
  for (const r of rows) {
    if (SUCCESS_OUTCOMES.has(r.outcomeType)) successes += 1;
    else failures += 1;
  }

  const total = successes + failures;
  if (total < MIN_SAMPLES) {
    return { show: true, reason: "insufficient_data" };
  }

  const successRate = successes / total;
  /** Deadband: suppress clearly weak rules; boost only sustained winners (fewer noisy highs). */
  if (successRate < 0.3) {
    return { show: false, reason: "low performance suppressed" };
  }
  if (successRate > 0.65) {
    return { show: true, reason: "high performance boosted" };
  }
  return { show: true, reason: "normal" };
}

/** Apply a small confidence bump when boosted (priority only; capped below 1). */
export function applyRankingConfidenceBoost(base: number, reason: RecommendationRankingResult["reason"]): number {
  if (reason !== "high performance boosted") return base;
  return Math.min(0.99, base * 1.025);
}
