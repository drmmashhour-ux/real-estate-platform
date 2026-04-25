/**
 * Configurable thresholds for deal classification — adjust per market without code changes to core formulas.
 * Not financial advice; tuning is for product UX only.
 */

export type DealClassificationId = "excellent" | "good" | "average" | "risky";

export type DealAnalyzerThresholds = {
  /** Minimum ROI % (year-1 cash-on-cash style) for "excellent" */
  excellentRoiMin: number;
  /** Minimum ROI % for "good" */
  goodRoiMin: number;
  /** Minimum ROI % for "average" */
  averageRoiMin: number;
  /** Excellent deals also need monthly cash flow >= this (CAD) */
  excellentCashFlowMonthlyMin: number;
  /** Gross yield below this (%) flags "high price vs rent" risk */
  minGrossYieldRiskPct: number;
  /** Operating + debt as % of gross rent — above flags expense risk */
  maxExpenseRatioWarning: number;
};

export const DEFAULT_DEAL_THRESHOLDS: DealAnalyzerThresholds = {
  excellentRoiMin: 12,
  goodRoiMin: 8,
  averageRoiMin: 5,
  excellentCashFlowMonthlyMin: 0,
  minGrossYieldRiskPct: 3.5,
  maxExpenseRatioWarning: 0.85,
};
