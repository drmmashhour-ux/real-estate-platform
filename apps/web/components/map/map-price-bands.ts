export type PriceBand = "low" | "medium" | "high";

export function priceBandForListing(
  price: number,
  prices: number[]
): PriceBand {
  const valid = prices.filter((p) => typeof p === "number" && !Number.isNaN(p) && p >= 0);
  if (valid.length === 0) return "medium";
  const min = Math.min(...valid);
  const max = Math.max(...valid);
  if (max <= min) return "medium";
  const t = (price - min) / (max - min);
  if (t < 1 / 3) return "low";
  if (t < 2 / 3) return "medium";
  return "high";
}

export function bandFillColor(band: PriceBand): string {
  switch (band) {
    case "low":
      return "#3b82f6";
    case "medium":
      return "#f59e0b";
    case "high":
      return "#ef4444";
    default:
      return "#64748b";
  }
}
