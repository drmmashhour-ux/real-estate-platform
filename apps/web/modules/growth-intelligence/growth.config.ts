/**
 * Deterministic thresholds for Growth Intelligence (tune without code structure changes).
 */

/** Views in window considered "meaningful traffic" for conversion diagnostics */
export const GROWTH_MIN_LISTING_VIEWS_FOR_CONVERSION = 50;

/** contact_click / listing_view — below this rate flags low conversion */
export const GROWTH_LOW_CONVERSION_RATIO_THRESHOLD = 0.02;

/** Region inventory below this vs median region suggests SEO/programmatic gap (relative check uses snapshot) */
export const GROWTH_SEO_GAP_MIN_LISTINGS_IN_REGION = 3;

/** Demand proxy: leads mentioning region / inventory ratio — imbalance when demandIndex > supply * factor */
export const GROWTH_DEMAND_SUPPLY_IMBALANCE_FACTOR = 2;

/** Dropoff: views present, contacts started (contact_click) but ratio below threshold */
export const GROWTH_LEAD_FORM_DROPOFF_RATIO = 0.005;

/** Days since last SEO blog update before "stale content" signal */
export const GROWTH_CONTENT_FRESHNESS_STALE_DAYS = 45;

/** Relative change in campaign efficiency (contacts/views) week-over-week to flag review */
export const GROWTH_CAMPAIGN_EFFICIENCY_SHIFT_PCT = 25;

/** Trust score band high but listing views in bottom quartile — trust conversion opportunity */
export const GROWTH_TRUST_HIGH_BAND_MIN = 70;

export const GROWTH_TRUST_EXPOSURE_VIEW_PERCENTILE_THRESHOLD = 0.25;

/** Trend reversal: prior-window count must exceed this to compare */
export const GROWTH_TREND_MIN_BASELINE_COUNT = 4;

/**
 * Relative drop in “positive” event volume (e.g. action_allowed) last 30d vs previous 30d
 * to flag trend_reversal (deterministic; not statistical testing).
 */
export const GROWTH_TREND_REVERSAL_RELATIVE_DROP = 0.35;

/** Stalled funnel: min workflows with activity but no completion in window */
export const GROWTH_STALLED_WORKFLOW_MIN = 3;

/** Same document entity: min rejections in 30d to flag repeat dropoff */
export const GROWTH_REPEAT_DROPOFF_MIN_REJECTIONS = 2;

/** Priority scoring weights (sum used for total — deterministic) */
export const GROWTH_PRIORITY_WEIGHTS = {
  revenueRelevance: 1.2,
  trafficConversionImpact: 1.4,
  trustComplianceLeverage: 1.1,
  regionalStrategicValue: 1.0,
  easeOfExecution: 0.9,
  repeatability: 0.8,
  missedOpportunitySeverity: 1.3,
  timelinePersistence: 0.85,
  worseningIndicator: 0.95,
  trustLeverageUnused: 0.9,
} as const;

/** Total score thresholds → GrowthPriorityLevel */
export const GROWTH_URGENT_SCORE_MIN = 85;
export const GROWTH_HIGH_SCORE_MIN = 65;
export const GROWTH_MEDIUM_SCORE_MIN = 40;
