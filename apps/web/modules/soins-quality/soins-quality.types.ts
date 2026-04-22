/**
 * Soins Hub — operational care quality scoring (platform-observable signals only).
 * Not a clinical certification; not a substitute for regulator or professional assessment.
 */

/** Seven weighted dimensions; each contributes 0–100 before weighting into the aggregate. */
export type SoinsQualityCategoryKey =
  | "care_responsiveness"
  | "family_communication"
  | "meal_reliability"
  | "alert_handling"
  | "service_completeness"
  | "resident_experience"
  | "transparency_documentation";

export type SoinsQualityBadgeLevel = "STANDARD" | "PREMIUM" | "ELITE";

/** Platform-observable inputs for a scoring window (typically 30–90 days). */
export type SoinsQualitySignals = {
  /** Length of observation window used for counts/rates (for audit labels). */
  windowDays: number;

  /** Median minutes from platform-logged alert/open item to first staff acknowledgment. */
  avgAlertResponseMinutes: number | null;

  /** 0–1 share of inbound family/resident portal messages replied within SLA. */
  familyMessageResponseRate: number | null;

  /** 0–1 meals delivered vs scheduled (where the platform tracks schedules). */
  mealCompletionRate: number | null;

  /** Operational metric: missed meal incidents per 100 resident-days (higher hurts). */
  missedMealsPer100ResidentDays: number | null;

  /** 0–1 alerts/tasks closed within policy timeframe. */
  alertResolutionWithinPolicyRate: number | null;

  /** Minutes to resolve typical non-critical operational alerts (lower is better). */
  avgNonCriticalAlertResolutionMinutes: number | null;

  /** 0–1 documented completion for scheduled care/service tasks attributable in-system. */
  documentedCareCompletenessRatio: number | null;

  /** Formal complaints surfaced through platform channels per 1000 resident-days (higher hurts). */
  complaintsPer1000ResidentDays: number | null;

  /**
   * Average structured satisfaction / experience score from permitted in-app surveys (0–100).
   * Not a medical outcome measure.
   */
  structuredFeedbackScoreAvg: number | null;

  /** 0–1 material documentation updates published within SLA after changes. */
  transparencyDocumentationTimeliness: number | null;

  /** 0–1 operator profile / directory completeness as recorded on LECIPM. */
  operatorProfileCompleteness: number | null;

  /**
   * True when platform rules detect unresolved critical operational issues (e.g. repeated missed safety
   * acknowledgments). Used only to cap badges — not a clinical judgment.
   */
  criticalUnresolvedOperationalIssues: boolean;
};

export type SoinsQualityCategoryScore = {
  key: SoinsQualityCategoryKey;
  label: string;
  score: number;
  /** Rounded for UI (weights sum to 1 in scoring service). */
  weight: number;
  rationale: string;
};

export type SoinsQualityExplainabilityLine = {
  code: string;
  impact: "positive" | "negative" | "neutral";
  message: string;
};

export type SoinsQualityComputed = {
  overallScore: number;
  categoryBreakdown: SoinsQualityCategoryScore[];
  strengths: string[];
  weaknesses: string[];
  explainability: SoinsQualityExplainabilityLine[];
};

export type SoinsQualityBadgeResult = {
  badgeLevel: SoinsQualityBadgeLevel;
  /** Why this tier was chosen or capped. */
  reasons: string[];
};

export type SoinsQualityResult = SoinsQualityComputed & {
  badge: SoinsQualityBadgeResult;
  signals: SoinsQualitySignals;
};

/** Full API response for residence-level breakdown. */
export type ResidenceQualityBreakdownDto = SoinsQualityResult & {
  residenceId: string;
  residenceName: string | null;
  dataFreshness: "live" | "partial" | "baseline";
};

/** Resident-facing experience view (family-safe wording). */
export type ResidentServiceExperienceDto = SoinsQualityResult & {
  residentProfileId: string;
  primaryResidenceId: string | null;
  perspective: "resident_experience_view";
};

/**
 * UI contract (consumers: listing cards, detail, admin review, family view).
 * - Listing card: overallScore, badgeLevel, shortStrength (first strength), trustDisclaimer.
 * - Detail: categoryBreakdown[], explainability[], badge reasons.
 * - Admin: full signals JSON + computed result + audit timestamps (wired at route layer).
 * - Family: overallScore, badgeLevel, categories as plain-language labels only.
 */
export type SoinsQualityListingCardVm = {
  overallScore: number;
  badgeLevel: SoinsQualityBadgeLevel;
  headlineStrength: string | null;
  trustDisclaimer: typeof SOINS_QUALITY_DISCLAIMER;
};

export const SOINS_QUALITY_DISCLAIMER =
  "This score reflects platform-observable operations and reported experience. It is not medical advice, certification, or proof of clinical quality.";
