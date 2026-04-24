/**
 * LECIPM AI Green Score — AI-assessed signals only unless document-supported.
 */

import type { QuebecEsgBreakdown, QuebecEsgLabel } from "./quebec-esg.engine";
import type { QuebecEsgRecommendation } from "./quebec-esg-recommendation.service";
import type { UpgradeSimulationResult } from "./quebec-esg-simulator.service";
import type { BrokerGreenCallouts } from "./quebec-esg-callouts.service";

export type GreenAiPerformanceLabel = "GREEN" | "IMPROVABLE" | "LOW";

export type GreenVerificationLevel = "AI_ESTIMATED" | "DOCUMENT_SUPPORTED" | "PROFESSIONAL_VERIFIED";

/** Required UI / API disclaimer — surfaces that imply certification must show this (or equivalent). */
export const LECIPM_GREEN_AI_DISCLAIMER =
  "This certification is based on AI analysis and provided data. It is not an official government or third-party certification.";

export const POSITIONING_GREEN_AI =
  "LECIPM helps you evaluate, improve, and showcase your property as a high-performance green asset.";

export type QuebecEsgBundle = {
  score: number;
  label: QuebecEsgLabel;
  breakdown: QuebecEsgBreakdown;
  improvementAreas: string[];
  /** Québec methodology disclaimer — distinct from general LECIPM disclaimer */
  quebecDisclaimer: string;
};

export type GreenAiEngineOutput = {
  score: number;
  label: GreenAiPerformanceLabel;
  verificationLevel: GreenVerificationLevel;
  confidence: number;
  issues: string[];
  recommendations: string[];
  /** Weighted Québec-inspired factor model (primary score driver) */
  quebecEsg: QuebecEsgBundle;
  quebecEsgRecommendations?: QuebecEsgRecommendation[];
  quebecEsgSimulation?: UpgradeSimulationResult;
  quebecEsgCallouts?: BrokerGreenCallouts;
};

export type GrantHintRow = {
  id: string;
  name: string;
  amount: string;
  reason: string;
  howToApply: string;
};

export type GreenUpgradePlanItem = {
  action: string;
  costEstimate: string;
  scoreImpact: number;
  priority: "HIGH" | "MEDIUM" | "LOW";
  /** Illustrative Québec programs — verify eligibility */
  grants?: GrantHintRow[];
};

export type PaidGreenTier = "basic" | "premium";

export const GREEN_VERIFICATION_PRODUCT = {
  BASIC: { tier: "basic" as const, label: "Basic", includes: ["LECIPM AI Green Score (estimated)"] },
  PREMIUM: {
    tier: "premium" as const,
    includes: ["Green Verification Report", "LECIPM Green Verified badge", "Listing priority boost"],
    indicativeCadMonthly: "49",
  },
} as const;
