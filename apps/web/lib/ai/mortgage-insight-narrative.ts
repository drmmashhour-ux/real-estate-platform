import { formatCurrencyCAD } from "@/lib/investment/format";

export type MortgageInsightInput = {
  propertyPrice: number;
  downPayment: number;
  annualIncome: number;
  estimatedApprovalAmount: number;
  approvalConfidence: string;
};

/**
 * Rule-based mortgage narrative when OpenAI is unavailable. Not a lending commitment.
 */
export function buildRuleBasedMortgageInsight(input: MortgageInsightInput): string {
  const { propertyPrice, downPayment, annualIncome, estimatedApprovalAmount, approvalConfidence } = input;
  const downPct = propertyPrice > 0 ? (downPayment / propertyPrice) * 100 : 0;
  const conf = approvalConfidence.toLowerCase();

  const rangePhrase = `you may be in range for financing around ${formatCurrencyCAD(
    estimatedApprovalAmount
  )} in estimated purchasing power for this scenario`;

  const downPhrase =
    downPct < 10
      ? "A larger down payment would typically improve approval chances and can reduce monthly payments."
      : downPct < 20
        ? "Moving toward 20% down often strengthens your file with lenders and can improve terms."
        : "With a solid down payment, your broker can focus on rate, term, and the right product fit.";

  const confPhrase =
    conf === "high"
      ? "Confidence in this rough estimate is relatively high given your down payment and income inputs."
      : conf === "medium"
        ? "There is moderate confidence — your broker will confirm what you qualify for."
        : "Treat this as a rough guide only; income documentation and policy rules will drive the real number.";

  return `Based on your ${formatCurrencyCAD(annualIncome)} annual income and ${formatCurrencyCAD(
    downPayment
  )} down (${downPct.toFixed(0)}% of ${formatCurrencyCAD(propertyPrice)}), ${rangePhrase}. ${downPhrase} ${confPhrase}`;
}
