/** Rule-based fallback when AI insight API fails — pure client heuristic. */

export type InvestmentInsightPayload = {
  city: string;
  propertyPrice: number;
  monthlyRentLongTerm: number;
  monthlyExpenses: number;
  nightlyRate: number;
  occupancyPercent: number;
  roiLongTerm: number;
  roiShortTerm: number;
  roiPreferred: number;
  monthlyCashFlow: number;
  shortTermWinsOnRoi: boolean;
};

export function buildRuleBasedInvestmentInsight(payload: InvestmentInsightPayload): {
  summary: string;
  suggestions: string[];
} {
  const {
    city,
    roiPreferred,
    monthlyCashFlow,
    shortTermWinsOnRoi,
    roiLongTerm,
    roiShortTerm,
    occupancyPercent,
  } = payload;

  const cityLabel = city.trim() || "this market";
  const roiPct = (roiPreferred * 100).toFixed(1);
  const cf = monthlyCashFlow;

  const summary =
    cf >= 0
      ? `Based on your inputs, ${cityLabel} shows about ${roiPct}% preferred ROI with positive monthly cash flow — ${
          shortTermWinsOnRoi ? "short-term" : "long-term"
        } currently looks stronger on ROI.`
      : `Based on your inputs, ${cityLabel} shows about ${roiPct}% preferred ROI but negative monthly cash flow at these assumptions — stress-test vacancy and expenses before committing.`;

  const suggestions: string[] = [];

  if (Math.abs(roiLongTerm - roiShortTerm) > 0.02) {
    suggestions.push(
      shortTermWinsOnRoi
        ? "Compare STR vs LTR vacancy, cleaning, and management costs — STR upside often comes with more volatility."
        : "If LTR wins on ROI with less operational load, it can be a simpler path than STR for your risk tolerance."
    );
  }

  if (occupancyPercent < 65 && shortTermWinsOnRoi) {
    suggestions.push("STR returns are sensitive to occupancy; model 10–15 points lower occupancy as a downside case.");
  }

  if (cf < 0) {
    suggestions.push("Increase down payment, reduce purchase price, or improve rent assumptions to restore positive cash flow if that is a requirement.");
  }

  if (suggestions.length === 0) {
    suggestions.push("Save this analysis and revisit after you have verified rent comps and operating expenses for your exact micro-market.");
  }

  return { summary, suggestions };
}
