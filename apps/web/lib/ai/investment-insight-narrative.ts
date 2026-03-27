import { formatCurrencyCAD } from "@/lib/investment/format";

export type InvestmentInsightInput = {
  city: string;
  propertyPrice: number;
  monthlyRentLongTerm: number;
  monthlyExpenses: number;
  nightlyRate: number;
  occupancyPercent: number;
  roiLongTerm: number;
  roiShortTerm: number;
  /** Preferred-strategy ROI (matches “Your results”). */
  roiPreferred: number;
  monthlyCashFlow: number;
  shortTermWinsOnRoi: boolean;
};

/**
 * Rule-based copy when OpenAI is unavailable or fails. Uses real inputs — not generic filler.
 */
export function buildRuleBasedInvestmentInsight(input: InvestmentInsightInput): {
  summary: string;
  suggestions: string[];
} {
  const {
    city,
    propertyPrice,
    monthlyRentLongTerm,
    monthlyExpenses,
    nightlyRate,
    occupancyPercent,
    roiLongTerm,
    roiShortTerm,
    roiPreferred,
    monthlyCashFlow,
    shortTermWinsOnRoi,
  } = input;

  const suggestions: string[] = [];
  const roi = roiPreferred;

  if (roi < 5) {
    suggestions.push(
      "At this ROI, the deal may not be optimal. Consider negotiating the price, increasing rent if the market supports it, or revisiting expenses."
    );
  }

  if (shortTermWinsOnRoi && roiShortTerm > roiLongTerm + 0.3) {
    suggestions.push(
      "Short-term rental could lift returns versus long-term on these numbers — but plan for higher variability, turnover, and local rules."
    );
  }

  if (!shortTermWinsOnRoi && roiShortTerm > roiLongTerm + 2 && roi < 8) {
    suggestions.push(
      "Short-term is stronger on paper here; if regulations and operations work for you, it may be worth modelling a conservative occupancy scenario."
    );
  }

  const returnBand =
    roi >= 8 ? "strong" : roi >= 5 ? "moderate" : roi >= 0 ? "modest" : "weak";

  const cashPhrase =
    monthlyCashFlow >= 0
      ? "monthly cash flow is positive after expenses"
      : "monthly cash flow is negative at these assumptions";

  const strategyPhrase = shortTermWinsOnRoi
    ? `Short-term leads on estimated cash-on-cash return (${roiShortTerm.toFixed(1)}% vs ${roiLongTerm.toFixed(
        1
      )}% for long-term), which usually means more moving parts and occupancy risk.`
    : `Long-term leads (${roiLongTerm.toFixed(1)}% vs ${roiShortTerm.toFixed(
        1
      )}% for short-term), which often means steadier income with fewer nightly turnovers.`;

  const summary = `In ${city}, with a ${formatCurrencyCAD(propertyPrice)} price, ${formatCurrencyCAD(
    monthlyRentLongTerm
  )}/mo long-term rent, ${formatCurrencyCAD(nightlyRate)}/night at ${occupancyPercent.toFixed(
    0
  )}% occupancy, and ${formatCurrencyCAD(monthlyExpenses)}/mo expenses, ${cashPhrase}. The preferred strategy shows about ${roi.toFixed(
    1
  )}% cash-on-cash — a ${returnBand} profile. ${strategyPhrase}`;

  return { summary, suggestions: suggestions.slice(0, 3) };
}
