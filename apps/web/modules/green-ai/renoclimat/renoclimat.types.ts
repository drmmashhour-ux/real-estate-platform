/**
 * AI-assisted Rénoclimat-style screening — not an official determination.
 */

export const RENOCLIMAT_OFFICIAL_DISCLAIMER =
  "I cannot confirm official eligibility. Verification must be done through certified Rénoclimat evaluators.";

export type RenoclimatEligibilityLevel = "HIGH" | "MEDIUM" | "LOW";

export type RenoclimatInsulation = "poor" | "average" | "good" | "unknown";

export type RenoclimatWindows = "single" | "double" | "triple_high_performance" | "unknown";

/** Inputs aligned with green intake + Québec location */
export type RenoclimatInput = {
  /** house | condo | … */
  propertyType: string;
  yearBuilt?: number | null;
  heatingType?: string | null;
  insulationQuality?: RenoclimatInsulation | null;
  windowsQuality?: RenoclimatWindows | null;
  /** Province / region label — Québec-only scope */
  locationRegion: string;
};

export type RenoclimatEligibilityResult = {
  eligible: boolean;
  eligibilityLevel: RenoclimatEligibilityLevel;
  reasons: string[];
  recommendedActions: string[];
  disclaimer: typeof RENOCLIMAT_OFFICIAL_DISCLAIMER;
  /** Short label for UI */
  headline: string;
};
