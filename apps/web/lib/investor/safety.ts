import type { InvestorAnalysisCase } from "@prisma/client";

const GUARANTEED_RETURN_RE =
  /guaranteed\s+return|guarantee(d)?\s+(profit|return|yield)|risk-?free\s+return|certain\s+winner|can't\s+lose|cannot\s+lose/i;

export function assertNoGuaranteedReturnLanguage(...parts: string[]): void {
  const text = parts.filter(Boolean).join(" ");
  if (GUARANTEED_RETURN_RE.test(text)) {
    throw new Error("GUARANTEED_RETURN_LANGUAGE_FORBIDDEN");
  }
}

/** Minimum inputs before running deterministic metrics. */
export function assertInvestmentInputsForCompute(row: Pick<InvestorAnalysisCase, "purchasePriceCents" | "monthlyRentCents">): void {
  const price = row.purchasePriceCents;
  const rent = row.monthlyRentCents;
  if (price == null || !Number.isFinite(price) || price <= 0) {
    throw new Error("INVESTMENT_INPUTS_REQUIRED");
  }
  if (rent == null || !Number.isFinite(rent) || rent < 0) {
    throw new Error("INVESTMENT_INPUTS_REQUIRED");
  }
}

export function assertComputedMetricsForAiSummary(
  row: Pick<
    InvestorAnalysisCase,
    "capRate" | "monthlyCashflowCents" | "annualCashflowCents" | "dscr" | "cashOnCashReturn" | "roiPercent"
  >,
): void {
  if (
    row.capRate == null ||
    !Number.isFinite(row.capRate) ||
    row.monthlyCashflowCents == null ||
    !Number.isFinite(row.monthlyCashflowCents) ||
    row.annualCashflowCents == null ||
    !Number.isFinite(row.annualCashflowCents)
  ) {
    throw new Error("COMPUTED_METRICS_REQUIRED");
  }
}
