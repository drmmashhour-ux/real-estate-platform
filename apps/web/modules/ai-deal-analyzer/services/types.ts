/** Shared input for the AI Deal Analyzer (illustrative modeling, not underwriting). */

export type DealAnalyzerInput = {
  listingId: string;
  /** Purchase or notional list price (USD). */
  price: number;
  city: string;
  propertyType: string;
  bedrooms: number | null;
  bathrooms: number | null;
  areaSqft: number | null;
  /** Long-term monthly rent estimate (USD), optional. */
  estimatedRent: number | null;
  condoFeesMonthly: number | null;
  propertyTaxAnnual: number | null;
  downPaymentPercent: number | null;
  mortgageRate: number | null;
  amortizationYears: number | null;
  /**
   * When true, price was derived from nightly rate or other proxy — shown in copy.
   */
  priceIsIllustrative: boolean;
};

export type DealMetricBlock = {
  monthlyMortgagePayment: number | null;
  estimatedMonthlyExpenses: number | null;
  estimatedMonthlyCashFlow: number | null;
  grossYield: number | null;
  estimatedDownPayment: number | null;
  mortgagePrincipal: number | null;
};

export type DealConfidence = "low" | "medium" | "high";

export type DealAnalysisResult = {
  score: number;
  confidence: DealConfidence;
  metrics: DealMetricBlock;
  riskFlags: string[];
  strengths: string[];
  summary: string;
};
