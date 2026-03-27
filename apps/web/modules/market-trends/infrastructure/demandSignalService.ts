/**
 * Very coarse demand hint from new vs active listings in a snapshot — not a demand forecast.
 */
export function demandRatioFromSnapshot(args: { newListingCount: number; activeListingCount: number }): {
  ratio: number | null;
  label: "weak_sample" | "neutral";
} {
  if (args.activeListingCount <= 0) return { ratio: null, label: "weak_sample" };
  return { ratio: args.newListingCount / args.activeListingCount, label: "neutral" };
}
