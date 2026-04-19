import type { LeadMonetizationConfidenceLevel } from "@/modules/leads/lead-monetization-control.types";

/** Advisory experiment lane — compares pricing postures without persisting or publishing. */
export type LeadPricingExperimentMode =
  | "baseline"
  | "quality_weighted"
  | "demand_weighted"
  | "conservative"
  | "aggressive";

export type LeadPricingExperimentResult = {
  mode: LeadPricingExperimentMode;
  suggestedPrice: number;
  deltaFromBase: number;
  confidenceLevel: LeadMonetizationConfidenceLevel;
  reasons: string[];
  warnings: string[];
};

export type LeadPricingOverrideStatus = "active" | "cleared" | "superseded";

/** Internal-only operator decision row — maps to DB; not used by checkout or unlock pricing engines. */
export type LeadPricingOverride = {
  id: string;
  leadId: string;
  basePrice: number;
  systemSuggestedPrice: number;
  overridePrice: number;
  reason: string;
  /** Operator user id */
  createdBy: string;
  createdAt: string;
  status: LeadPricingOverrideStatus;
};

export type LeadPricingDisplayPrecedence =
  | "operator_override"
  | "monetization_primary"
  | "base_fallback";

export type LeadPricingComparisonSummary = {
  leadId: string;
  basePrice: number;
  primarySuggestedPrice: number;
  experimentResults: LeadPricingExperimentResult[];
  activeOverride?: LeadPricingOverride | null;
  selectedDisplayMode: LeadPricingDisplayPrecedence;
  explanation: string;
};
