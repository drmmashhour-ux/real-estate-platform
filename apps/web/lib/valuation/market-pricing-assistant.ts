import { computeConfidenceScore, getDataConfidenceNote } from "./confidence";
import { estimatePublicPropertyValue, type PublicValuationInput } from "./public-mvp";

export type PricingAssistantMode = "buyer" | "seller";

export type PricingAssistantInput = PublicValuationInput & {
  askingPrice: number;
  mode: PricingAssistantMode;
};

export type PricingAssistantResult = {
  suggestedPrice: number;
  suggestedMin: number;
  suggestedMax: number;
  confidenceScore: number;
  confidenceLabel: "low" | "medium" | "high";
  marketPosition: "below_range" | "within_range" | "above_range";
  priceGapPercent: number;
  summary: string;
  recommendation: string;
  negotiationAngle: string;
  signals: string[];
  warnings: string[];
  dataConfidenceNote: string;
  valuation: ReturnType<typeof estimatePublicPropertyValue>;
};

function pct(delta: number, base: number): number {
  if (!Number.isFinite(base) || base <= 0) return 0;
  return (delta / base) * 100;
}

export function getMarketPricingAssistant(input: PricingAssistantInput): PricingAssistantResult {
  const valuation = estimatePublicPropertyValue(input);
  const askingPrice = Math.max(0, Number(input.askingPrice) || 0);
  const suggestedPrice = valuation.estimatedValue;
  const suggestedMin = valuation.rangeMin;
  const suggestedMax = valuation.rangeMax;

  const marketPosition =
    askingPrice < suggestedMin ? "below_range" : askingPrice > suggestedMax ? "above_range" : "within_range";

  const priceGapPercent = Number(pct(askingPrice - suggestedPrice, suggestedPrice).toFixed(1));

  const completenessScore =
    [input.address, input.city, input.propertyType]
      .filter((value) => typeof value === "string" && value.trim().length > 0).length / 3;

  const signalConsistency =
    input.condition && ["Excellent", "Good", "Fair", "Needs work"].includes(input.condition) ? 0.75 : 0.6;

  const { score: confidenceScore, label: confidenceLabel } = computeConfidenceScore({
    comparableCount: valuation.cityKey === "other" ? 1 : 3,
    dataCompleteness: completenessScore,
    signalConsistency,
    dataFreshnessDays: 14,
  });

  const signals = [
    `Estimated market midpoint: $${valuation.estimatedValue.toLocaleString("en-CA")}`,
    `Estimated market band: $${valuation.rangeMin.toLocaleString("en-CA")} to $${valuation.rangeMax.toLocaleString("en-CA")}`,
    `City pricing band used: ${valuation.cityKey} at about $${valuation.pricePerSqftMid.toLocaleString("en-CA")} / sqft`,
  ];

  if (input.condition) {
    signals.push(`Condition signal applied: ${input.condition}`);
  }
  if (Number.isFinite(input.bedrooms)) {
    signals.push(`Bedrooms entered: ${input.bedrooms}`);
  }
  if (Number.isFinite(input.bathrooms)) {
    signals.push(`Bathrooms entered: ${input.bathrooms}`);
  }

  const warnings = [
    "This is a rules-based market guide, not a certified appraisal.",
    confidenceLabel === "low"
      ? "Confidence is low because the estimate relies on broad market bands rather than rich comparable sales."
      : "Always confirm with fresh comparable listings and a licensed professional before making a binding decision.",
  ];

  let summary: string;
  let recommendation: string;
  let negotiationAngle: string;

  if (input.mode === "buyer") {
    if (marketPosition === "above_range") {
      summary = `The asking price looks above the platform's estimated market band by about ${Math.abs(priceGapPercent).toFixed(1)}%.`;
      recommendation =
        "Approach this as a negotiation file. Ask for supporting comparables, seller justification, and be disciplined on your walk-away number.";
      negotiationAngle =
        "Use the estimated range as an anchor and ask what upgrades, location advantages, or scarcity factors justify the premium.";
    } else if (marketPosition === "below_range") {
      summary = `The asking price appears below the estimated market band by about ${Math.abs(priceGapPercent).toFixed(1)}%.`;
      recommendation =
        "This may be an attractive price, but verify condition, urgency, legal disclosures, and any hidden costs before moving fast.";
      negotiationAngle =
        "Focus less on aggressive discounting and more on speed, clean conditions, and verifying whether the pricing reflects property issues.";
    } else {
      summary = "The asking price sits inside the estimated market band.";
      recommendation =
        "This looks reasonably aligned with broad market positioning. Your next edge is negotiation on terms, conditions, financing timing, and inspection strategy.";
      negotiationAngle =
        "Negotiate around inspection windows, inclusions, closing date, and financing certainty rather than relying only on price pressure.";
    }
  } else {
    if (marketPosition === "above_range") {
      summary = `Your asking price appears above the estimated market band by about ${Math.abs(priceGapPercent).toFixed(1)}%.`;
      recommendation =
        "Consider a pricing review. If showings or offers are weak, reposition closer to the market band to improve buyer confidence and response speed.";
      negotiationAngle =
        "If you keep the current price, prepare a clear justification package: renovations, unique features, location premium, and supporting comparables.";
    } else if (marketPosition === "below_range") {
      summary = `Your asking price appears below the estimated market band by about ${Math.abs(priceGapPercent).toFixed(1)}%.`;
      recommendation =
        "You may be underpricing relative to broad market signals. Review whether the lower price is strategic or whether you should test a stronger ask.";
      negotiationAngle =
        "If interest is strong, you can tighten your negotiation floor and justify a firmer position with market context and property strengths.";
    } else {
      summary = "Your asking price is positioned inside the estimated market band.";
      recommendation =
        "This is a healthy pricing zone for market alignment. The next lever is presentation quality, disclosure completeness, and response speed to buyers.";
      negotiationAngle =
        "Defend the price using clean documentation, strong visuals, and a clear explanation of the property's strengths instead of jumping to reductions too early.";
    }
  }

  return {
    suggestedPrice,
    suggestedMin,
    suggestedMax,
    confidenceScore,
    confidenceLabel,
    marketPosition,
    priceGapPercent,
    summary,
    recommendation,
    negotiationAngle,
    signals,
    warnings,
    dataConfidenceNote: getDataConfidenceNote(confidenceLabel),
    valuation,
  };
}
