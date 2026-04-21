import type { EsgActionCategory, EsgActionType, PaybackBand } from "./esg-action.types";

export type RoiEstimate = {
  estimatedScoreImpact: number;
  estimatedCarbonImpact: number;
  estimatedConfidenceImpact: number;
  estimatedCostBand: "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN";
  paybackBand: PaybackBand;
  /** Plain-language bands only — no fake precision */
  rationale: string;
  confidenceBand: "LOW" | "MEDIUM" | "HIGH";
};

/** Directional ROI bands + rationale — advisory only */
export function estimateRoiForTemplate(input: {
  category: EsgActionCategory;
  actionType: EsgActionType;
  reasonCode: string;
}): RoiEstimate {
  const base: RoiEstimate = {
    estimatedScoreImpact: 5,
    estimatedCarbonImpact: 5,
    estimatedConfidenceImpact: 10,
    estimatedCostBand: "LOW",
    paybackBand: "UNKNOWN",
    rationale: "",
    confidenceBand: "MEDIUM",
  };

  if (input.reasonCode.startsWith("EVIDENCE_") || input.reasonCode.startsWith("DOC_RESOLVE_")) {
    return {
      estimatedScoreImpact: 8,
      estimatedCarbonImpact: 3,
      estimatedConfidenceImpact: 35,
      estimatedCostBand: "LOW",
      paybackBand: "<3Y",
      rationale:
        "Closing evidence gaps typically raises investor readiness and underwriting confidence before it moves headline scores materially.",
      confidenceBand: "HIGH",
    };
  }

  if (input.category === "DISCLOSURE" || input.reasonCode.includes("DISCLOSURE")) {
    return {
      estimatedScoreImpact: 12,
      estimatedCarbonImpact: 5,
      estimatedConfidenceImpact: 28,
      estimatedCostBand: "LOW",
      paybackBand: "<3Y",
      rationale:
        "Disclosure completeness improves diligence speed; score lift is usually moderate until backed by metering or audits.",
      confidenceBand: "MEDIUM",
    };
  }

  if (input.category === "ENERGY" && input.actionType === "QUICK_WIN") {
    return {
      estimatedScoreImpact: 10,
      estimatedCarbonImpact: 18,
      estimatedConfidenceImpact: 15,
      estimatedCostBand: "LOW",
      paybackBand: "<3Y",
      rationale:
        "Low-effort operational measures can improve measured performance modestly with faster payback than envelope mega-projects.",
      confidenceBand: "MEDIUM",
    };
  }

  if (input.category === "ENERGY" && input.actionType === "CAPEX") {
    return {
      estimatedScoreImpact: 22,
      estimatedCarbonImpact: 35,
      estimatedConfidenceImpact: 12,
      estimatedCostBand: "HIGH",
      paybackBand: "3-7Y",
      rationale:
        "Major HVAC / envelope work can materially change carbon and operating profile; timing and savings depend on fuel mix and occupancy.",
      confidenceBand: "LOW",
    };
  }

  if (input.category === "CARBON") {
    return {
      estimatedScoreImpact: 14,
      estimatedCarbonImpact: 40,
      estimatedConfidenceImpact: 10,
      estimatedCostBand: "MEDIUM",
      paybackBand: "7Y+",
      rationale:
        "Carbon outcomes depend on grid intensity, refrigerants, and lifecycle assumptions — express as directional upside only.",
      confidenceBand: "LOW",
    };
  }

  if (input.category === "RESILIENCE") {
    return {
      estimatedScoreImpact: 15,
      estimatedCarbonImpact: 8,
      estimatedConfidenceImpact: 22,
      estimatedCostBand: "MEDIUM",
      paybackBand: "<3Y",
      rationale:
        "Adaptation planning often improves lender/investor comfort before it shows in operational carbon metrics.",
      confidenceBand: "MEDIUM",
    };
  }

  if (input.category === "CERTIFICATION") {
    return {
      estimatedScoreImpact: 18,
      estimatedCarbonImpact: 10,
      estimatedConfidenceImpact: 25,
      estimatedCostBand: "MEDIUM",
      paybackBand: "3-7Y",
      rationale:
        "Certification paths can lift perceived quality and financing access; realized asset score depends on verified performance.",
      confidenceBand: "MEDIUM",
    };
  }

  if (input.category === "FINANCE") {
    return {
      estimatedScoreImpact: 10,
      estimatedCarbonImpact: 5,
      estimatedConfidenceImpact: 18,
      estimatedCostBand: "LOW",
      paybackBand: "<3Y",
      rationale:
        "Green financing readiness mainly improves execution certainty and bid quality rather than a raw ESG score tick.",
      confidenceBand: "MEDIUM",
    };
  }

  if (input.category === "HEALTH") {
    return {
      estimatedScoreImpact: 12,
      estimatedCarbonImpact: 6,
      estimatedConfidenceImpact: 14,
      estimatedCostBand: "MEDIUM",
      paybackBand: "3-7Y",
      rationale:
        "Ventilation / IEQ upgrades support occupant outcomes; energy interaction varies by system design.",
      confidenceBand: "LOW",
    };
  }

  base.rationale =
    "Directional estimate from template rules — validate with asset-specific engineering and metering.";
  return base;
}
