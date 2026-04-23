/**
 * Heuristic risk band from debt service and monthly cashflow (cents).
 */
export function computeRiskLevel(dscr: number, cashflow: number) {
  if (!Number.isFinite(dscr) || dscr < 1 || !Number.isFinite(cashflow) || cashflow < 0) return "high";
  if (dscr < 1.2) return "medium";
  return "low";
}
