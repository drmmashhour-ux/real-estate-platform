/**
 * Deterministic investor metrics — estimates only, not financial advice.
 */

export type DealVerdict = "strong" | "moderate" | "risky";

export type DealAnalysisResult = {
  grossAnnualRent: number;
  effectiveGrossIncome: number;
  estimatedExpenses: number;
  noi: number;
  capRatePct: number;
  roiPct: number;
  cashFlowAnnual: number;
  verdict: DealVerdict;
};

export function analyzeDealDeterministic(input: {
  purchasePrice: number;
  monthlyRent: number;
  annualExpenses: number;
  vacancyRatePct: number;
}): DealAnalysisResult {
  const grossAnnualRent = input.monthlyRent * 12;
  const vacancy = input.vacancyRatePct / 100;
  const effectiveGrossIncome = grossAnnualRent * (1 - vacancy);
  const estimatedExpenses = input.annualExpenses;
  const noi = effectiveGrossIncome - estimatedExpenses;
  const capRatePct = input.purchasePrice > 0 ? (noi / input.purchasePrice) * 100 : 0;
  const roiPct = input.purchasePrice > 0 ? (noi / input.purchasePrice) * 100 : 0;
  const cashFlowAnnual = noi;

  let verdict: DealVerdict = "moderate";
  if (capRatePct >= 6 && noi > 0) verdict = "strong";
  else if (capRatePct < 3 || noi <= 0) verdict = "risky";

  return {
    grossAnnualRent,
    effectiveGrossIncome,
    estimatedExpenses,
    noi,
    capRatePct,
    roiPct,
    cashFlowAnnual,
    verdict,
  };
}
