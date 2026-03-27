import type { MarketSnapshot } from "@prisma/client";

export type InventoryTrendLabel = "upward_pressure" | "neutral" | "downward_pressure" | "insufficient_data";

/**
 * Conservative inventory pressure from two snapshots (listing counts only — not an appraisal).
 */
export function inventoryTrendFromSnapshots(
  newer: Pick<MarketSnapshot, "activeListingCount" | "confidenceLevel">,
  older: Pick<MarketSnapshot, "activeListingCount" | "confidenceLevel">
): { label: InventoryTrendLabel; notes: string } {
  if (older.confidenceLevel === "insufficient_data" || newer.confidenceLevel === "insufficient_data") {
    return { label: "insufficient_data", notes: "Inventory coverage is weak for this window." };
  }
  const delta = newer.activeListingCount - older.activeListingCount;
  const base = Math.max(older.activeListingCount, 1);
  const r = delta / base;
  if (r > 0.05) {
    return {
      label: "upward_pressure",
      notes: "Active listings increased in the sample — use as context only.",
    };
  }
  if (r < -0.05) {
    return {
      label: "downward_pressure",
      notes: "Active listings decreased in the sample — use as context only.",
    };
  }
  return { label: "neutral", notes: "Inventory change is within the neutral band." };
}
