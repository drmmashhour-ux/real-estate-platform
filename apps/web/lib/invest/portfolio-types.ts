/** Shared investor portfolio inputs — safe for client bundles (no server-only imports). */

export type InvestorProfileInput = {
  budgetCents?: number | null;
  downPaymentCents?: number | null;
  targetCities: string[];
  strategy: "cash_flow" | "appreciation" | "balanced" | string | null;
  riskTolerance: "low" | "medium" | "high" | string | null;
  propertyTypes: string[];
  targetRoiPercent?: number | null;
  targetCashFlowCents?: number | null;
  timeHorizonYears?: number | null;
};
