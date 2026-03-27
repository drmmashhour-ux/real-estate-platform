/**
 * AVM constants and valuation types.
 */

export const VALUATION_TYPES = ["sale", "long_term_rental", "short_term_rental", "investment"] as const;
export type ValuationType = (typeof VALUATION_TYPES)[number];

export const CONFIDENCE_LABELS = ["low", "medium", "high"] as const;
export type ConfidenceLabel = (typeof CONFIDENCE_LABELS)[number];

export const RISK_LEVELS = ["low", "medium", "high"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const PRICE_POSITION_LABELS = ["overvalued", "fair", "undervalued"] as const;
export type PricePositionLabel = (typeof PRICE_POSITION_LABELS)[number];

/** Confidence score thresholds (0-100) -> label */
export const CONFIDENCE_THRESHOLDS: { max: number; label: ConfidenceLabel }[] = [
  { max: 40, label: "low" },
  { max: 75, label: "medium" },
  { max: 100, label: "high" },
];

export const AVM_DISCLAIMER =
  "This is an AI-assisted estimate, not a legal appraisal. Where a licensed appraisal is required, obtain a professional valuation.";
