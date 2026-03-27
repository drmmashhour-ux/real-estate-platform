function clamp(n: number): number {
  return Math.min(100, Math.max(0, Math.round(n)));
}

export type DealConfidenceArgs = {
  comparableCount: number;
  documentCompleteness: number;
  declarationCompleteness: number;
  /** 0–100 listing freshness */
  freshnessScore: number;
  /** 0–100 demand signal reliability */
  demandReliability: number;
};

/**
 * DealConfidence =
 * 0.40*ComparableQuality + 0.20*DataCompleteness + 0.20*Freshness + 0.20*DemandReliability
 */
export function comparableQualityScore(comparableCount: number): number {
  if (comparableCount >= 6) return 100;
  if (comparableCount >= 3) return 80;
  if (comparableCount >= 1) return 55;
  return 25;
}

export function computeDealConfidence(args: DealConfidenceArgs): number {
  const cq = comparableQualityScore(args.comparableCount);
  const dataCompleteness = clamp(((args.documentCompleteness + args.declarationCompleteness) / 2) * 100);
  const s =
    0.4 * cq + 0.2 * dataCompleteness + 0.2 * args.freshnessScore + 0.2 * args.demandReliability;
  return clamp(s);
}
