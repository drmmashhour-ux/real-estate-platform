export function calculateGrossCommission(salePrice: number, commissionRate: number): number {
  if (salePrice < 0 || commissionRate < 0 || commissionRate > 1) {
    throw new Error("invalid_commission_inputs");
  }
  return Math.round(salePrice * commissionRate * 100) / 100;
}

/**
 * Net commission after simple deductions (fees as flat amounts). Extend with split rules in commission-service.
 */
export function calculateNetCommission(gross: number, deductionsTotal: number): number {
  const n = gross - deductionsTotal;
  if (n < 0) throw new Error("invalid_net_commission");
  return Math.round(n * 100) / 100;
}

export type SplitInput = { percent?: number | null; amount?: number | null };

/**
 * Validates that percent splits sum to ~100% or amounts sum to gross (exclusive strategies).
 */
export function validateCommissionSplits(
  gross: number,
  splits: SplitInput[],
  mode: "percent" | "amount"
): void {
  if (mode === "percent") {
    const total = splits.reduce((s, x) => s + (x.percent ?? 0), 0);
    if (Math.abs(total - 100) > 0.02) throw new Error("split_percent_must_total_100");
    return;
  }
  const total = splits.reduce((s, x) => s + (x.amount ?? 0), 0);
  if (Math.abs(total - gross) > 0.02) throw new Error("split_amounts_must_match_gross");
}
