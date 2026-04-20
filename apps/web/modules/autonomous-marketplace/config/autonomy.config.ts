import type { ActionType, AutonomyMode } from "../types/domain.types";

function envNum(key: string, fallback: number): number {
  const v = process.env[key];
  if (v === undefined || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function envBool(key: string, fallback: boolean): boolean {
  const v = process.env[key];
  if (v === undefined || v === "") return fallback;
  return v === "1" || v === "true";
}

/**
 * Central autonomy thresholds — override via `AUTONOMY_*` (see apps/web/.env.example).
 * Used by `modules/autonomous-marketplace` and gated by `FEATURE_AUTONOMOUS_MARKETPLACE_V1`.
 */
export const autonomyConfig = {
  /** Global kill switch layered on FEATURE_AUTONOMOUS_MARKETPLACE_V1 */
  enabled: envBool("AUTONOMY_ENGINE_ENABLED", true),

  /** Per-domain gates (listing / campaign / lead pipelines) */
  domains: {
    listings: envBool("AUTONOMY_DOMAIN_LISTINGS", true),
    campaigns: envBool("AUTONOMY_DOMAIN_CAMPAIGNS", true),
    leads: envBool("AUTONOMY_DOMAIN_LEADS", true),
  },

  /** Default mode when caller omits */
  defaultMode: (process.env.AUTONOMY_DEFAULT_MODE ?? "ASSIST") as AutonomyMode,

  /** Default to dry-run unless explicitly overridden and policy allows */
  defaultDryRun: envBool("AUTONOMY_DEFAULT_DRY_RUN", true),

  /**
   * When false, governance never sets `allowExecution` even for `AUTO_EXECUTE`
   * ( disposition still reflects eligibility for UI / auditing ).
   */
  governanceAutoExecuteEnabled: envBool("AUTONOMY_GOVERNANCE_AUTO_EXECUTE", false),

  /**
   * Broker→lead outbound: when false, SEND_LEAD_FOLLOWUP never implies direct send;
   * executors create tasks/drafts only (matches LECIPM safe communication posture).
   */
  messaging: {
    directOutboundAllowed: envBool("AUTONOMY_MESSAGING_DIRECT_OUTBOUND", false),
  },

  pricing: {
    maxIncreasePctPerRun: envNum("AUTONOMY_MAX_PRICE_INCREASE_PCT_RUN", 3),
    maxDecreasePctPerRun: envNum("AUTONOMY_MAX_PRICE_DECREASE_PCT_RUN", 5),
    maxIncreasePctPerDay: envNum("AUTONOMY_MAX_PRICE_INCREASE_PCT_DAY", 5),
    maxDecreasePctPerDay: envNum("AUTONOMY_MAX_PRICE_DECREASE_PCT_DAY", 10),
    minSuggestDeltaPct: envNum("AUTONOMY_MIN_PRICE_SUGGEST_DELTA_PCT", 1),
  },

  promotions: {
    maxActivePerListing: envNum("AUTONOMY_MAX_ACTIVE_PROMOTIONS_PER_LISTING", 1),
  },

  outreach: {
    minHoursBetweenFollowUps: envNum("AUTONOMY_MIN_HOURS_BETWEEN_FOLLOWUPS", 4),
    maxFollowUpsBeforeReview: envNum("AUTONOMY_MAX_FOLLOWUPS_BEFORE_REVIEW_FLAG", 4),
  },

  budget: {
    maxScalePctPerRun: envNum("AUTONOMY_MAX_CAMPAIGN_SCALE_PCT_RUN", 25),
    maxReducePctPerRun: envNum("AUTONOMY_MAX_CAMPAIGN_REDUCE_PCT_RUN", 30),
    maxScaleAbsolute: envNum("AUTONOMY_MAX_CAMPAIGN_SCALE_ABSOLUTE_UNITS", 500),
  },

  detectors: {
    staleListingDays: envNum("AUTONOMY_STALE_LISTING_DAYS", 45),
    lowConversionViewsThreshold: envNum("AUTONOMY_LOW_CONVERSION_VIEWS", 80),
    lowConversionRate: envNum("AUTONOMY_LOW_CONVERSION_RATE", 0.02),
    highCtrThreshold: envNum("AUTONOMY_HIGH_CTR", 0.025),
    weakDescriptionMinChars: envNum("AUTONOMY_WEAK_DESCRIPTION_CHARS", 120),
    minPhotosWarn: envNum("AUTONOMY_MIN_PHOTOS_WARN", 3),
    minPhotosStrong: envNum("AUTONOMY_MIN_PHOTOS_STRONG", 6),
    abandonedLeadHours: envNum("AUTONOMY_ABANDONED_LEAD_HOURS", 48),
    inactiveHostHours: envNum("AUTONOMY_INACTIVE_HOST_HOURS", 168),
  },

  highRiskActionTypes: [
    "APPLY_PRICE_CHANGE",
    "SCALE_CAMPAIGN_BUDGET",
    "REDUCE_CAMPAIGN_BUDGET",
    "START_PROMOTION",
    "STOP_PROMOTION",
    "SEND_LEAD_FOLLOWUP",
  ] as const satisfies readonly ActionType[],

  complianceSensitiveTypes: [
    "SEND_LEAD_FOLLOWUP",
    "APPLY_PRICE_CHANGE",
    "START_PROMOTION",
  ] as const satisfies readonly ActionType[],

  actionExecutionAllowed: {
    UPDATE_LISTING_COPY: envBool("AUTONOMY_EXEC_UPDATE_LISTING_COPY", false),
    REFRESH_LISTING_CONTENT: envBool("AUTONOMY_EXEC_REFRESH_LISTING_CONTENT", false),
    SUGGEST_AMENITIES_COMPLETION: envBool("AUTONOMY_EXEC_SUGGEST_AMENITIES", true),
    SUGGEST_PRICE_CHANGE: envBool("AUTONOMY_EXEC_SUGGEST_PRICE_CHANGE", true),
    APPLY_PRICE_CHANGE: envBool("AUTONOMY_EXEC_APPLY_PRICE_CHANGE", false),
    START_PROMOTION: envBool("AUTONOMY_EXEC_START_PROMOTION", false),
    STOP_PROMOTION: envBool("AUTONOMY_EXEC_STOP_PROMOTION", false),
    SCALE_CAMPAIGN_BUDGET: envBool("AUTONOMY_EXEC_SCALE_CAMPAIGN", false),
    REDUCE_CAMPAIGN_BUDGET: envBool("AUTONOMY_EXEC_REDUCE_CAMPAIGN", false),
    SEND_LEAD_FOLLOWUP: envBool("AUTONOMY_EXEC_SEND_LEAD_FOLLOWUP", false),
    CREATE_TASK: envBool("AUTONOMY_EXEC_CREATE_TASK", true),
    FLAG_REVIEW: envBool("AUTONOMY_EXEC_FLAG_REVIEW", true),
    REQUEST_HUMAN_APPROVAL: envBool("AUTONOMY_EXEC_REQUEST_HUMAN_APPROVAL", true),
    LEGAL_COMPLIANCE_GATE: envBool("AUTONOMY_EXEC_LEGAL_COMPLIANCE_GATE", false),
  } satisfies Record<ActionType, boolean>,
} as const;

export type AutonomyConfig = typeof autonomyConfig;
