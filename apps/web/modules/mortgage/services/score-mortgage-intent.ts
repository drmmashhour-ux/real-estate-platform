/** Auto-score lead intent from qualification answers (stored on MortgageRequest). */
export function scoreMortgageIntentLevel(params: {
  income: number;
  propertyPrice: number;
  downPayment: number;
  timeline: string;
  preApproved: boolean;
}): "low" | "medium" | "high" {
  const { income, propertyPrice, downPayment, timeline, preApproved } = params;
  const downRatio = propertyPrice > 0 ? downPayment / propertyPrice : 0;

  if (income > 0 && downRatio > 0.1 && timeline === "immediate") {
    return "high";
  }
  if (preApproved || timeline === "immediate" || timeline === "1-3 months") {
    return "medium";
  }
  return "low";
}

export const MORTGAGE_TIMELINE_VALUES = ["immediate", "1-3 months", "3+ months"] as const;
export type MortgageTimeline = (typeof MORTGAGE_TIMELINE_VALUES)[number];

export function parseMortgageTimeline(raw: unknown): MortgageTimeline | null {
  if (typeof raw !== "string") return null;
  return MORTGAGE_TIMELINE_VALUES.includes(raw as MortgageTimeline) ? (raw as MortgageTimeline) : null;
}
