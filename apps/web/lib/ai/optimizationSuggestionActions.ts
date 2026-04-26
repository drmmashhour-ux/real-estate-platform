import type { AutonomousAction } from "./executor";

export type OptimizationSuggestionRow = {
  id: string;
  listingId: string;
  fieldType: string;
  currentValue: string | null;
  proposedValue: string | null;
  reason?: string | null;
};

/**
 * Maps a `ListingOptimizationSuggestion`-style row to {@link AutonomousAction}s for the executor.
 */
export function actionsFromOptimizationSuggestion(
  row: OptimizationSuggestionRow
): AutonomousAction[] {
  const field = (row.fieldType ?? "").toLowerCase();
  if (field.includes("price") || field === "night_rate" || field === "nightly") {
    const next = row.proposedValue != null && row.proposedValue !== "" ? Number(row.proposedValue) : NaN;
    if (!Number.isFinite(next) || next < 0) {
      return [
        {
          type: "listing_improvement",
          issues: ["invalid_price_suggestion"],
          actions: [row.proposedValue ?? "Could not parse proposed nightly price."],
        },
      ];
    }
    const prev = row.currentValue != null && row.currentValue !== "" ? Number(row.currentValue) : null;
    const changePct =
      prev != null && Number.isFinite(prev) && prev > 0 ? (next - prev) / prev : undefined;
    return [
      {
        type: "price_update",
        newPrice: next,
        ...(changePct != null && Number.isFinite(changePct) ? { changePct } : {}),
      },
    ];
  }
  return [
    {
      type: "listing_improvement",
      issues: [row.fieldType || "field"],
      actions: [row.proposedValue ?? ""],
    },
  ];
}
