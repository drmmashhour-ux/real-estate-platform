/**
 * Numeric conflict penalties (production table).
 */

export function computeNumericConflictPenalty(args: {
  trustScore: number;
  dealScoreRaw: number;
  dealConfidence: number;
}): number {
  let p = 0;
  if (args.trustScore < 50 && args.dealScoreRaw > 70) p += 15;
  if (args.dealConfidence < 40 && args.dealScoreRaw > 70) p += 10;
  return p;
}
