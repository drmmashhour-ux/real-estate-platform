export type MortgageInsightInput = {
  propertyPrice: number;
  downPayment: number;
  annualIncome: number;
  estimatedApprovalAmount?: number | null;
  approvalConfidence?: string | null;
};

export function buildRuleBasedMortgageInsight(input: MortgageInsightInput): string {
  const price = Math.max(1, input.propertyPrice);
  const down = Math.max(0, input.downPayment);
  const ltvPct = Math.min(97, Math.round(((price - down) / price) * 100));
  const gdsHint =
    input.annualIncome > 0
      ? ((((price - down) * 0.055) / 12 / input.annualIncome) * 12 * 100).toFixed(1)
      : "—";

  const approval =
    input.estimatedApprovalAmount != null && input.estimatedApprovalAmount > 0
      ? `Estimated approval (~$${Math.round(input.estimatedApprovalAmount).toLocaleString()}${input.approvalConfidence ? `, ${input.approvalConfidence} confidence` : ""}).`
      : "No approval estimate yet — tighten income and down-payment inputs.";

  return (
    `${approval} Leverage indicators: roughly ${ltvPct}% loan-to-price and a coarse GDS-style signal ~${gdsHint}% vs income — illustrative only.` +
    " Speak with a licensed broker before locking a rate."
  );
}
