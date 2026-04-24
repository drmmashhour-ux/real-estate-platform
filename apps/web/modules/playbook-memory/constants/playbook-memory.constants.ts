/** Safety default: high-friction domains cap autonomy for automation. */
export const HIGH_RISK_MEMORY_DOMAINS = new Set<string>(["MESSAGING", "RISK"]);

/** External outbound messaging must not be triggered by playbook automation (policy). */
export const DISALLOW_AUTOPILOT_ACTION_TYPES = new Set<string>([
  "send_customer_message",
  "external_sms",
  "external_whatsapp",
]);

// --- Wave 6: lifecycle / governance thresholds (deterministic) ---

export const PLAYBOOK_PROMOTION_MIN_EXECUTIONS = 10;
export const PLAYBOOK_PROMOTION_MIN_SUCCESSES = 6;
export const PLAYBOOK_PROMOTION_MIN_SUCCESS_RATE = 0.55;
export const PLAYBOOK_PROMOTION_MAX_RISK = 0.35;

export const PLAYBOOK_ELITE_MIN_EXECUTIONS = 25;
export const PLAYBOOK_ELITE_MIN_SUCCESS_RATE = 0.7;
export const PLAYBOOK_ELITE_MAX_RISK = 0.2;

export const PLAYBOOK_DEMOTION_MIN_EXECUTIONS = 10;
export const PLAYBOOK_DEMOTION_MAX_FAILURE_RATE = 0.5;
export const PLAYBOOK_DEMOTION_MIN_RECENT_SUCCESS_RATE = 0.4;
export const PLAYBOOK_DEMOTION_MAX_RISK = 0.6;

export const PLAYBOOK_RECENT_WINDOW = 10;

/** Max average realized risk for execution to be allowed (governance gate). */
export const PLAYBOOK_GOVERNANCE_MAX_AVG_RISK = PLAYBOOK_PROMOTION_MAX_RISK;

// --- Legacy aliases (V1) — prefer Wave 6 names above ---

export const PLAYBOOK_MIN_EXECUTIONS_PROMOTE = PLAYBOOK_PROMOTION_MIN_EXECUTIONS;
export const PLAYBOOK_MIN_SUCCESS_RATE_PROMOTE = PLAYBOOK_PROMOTION_MIN_SUCCESS_RATE;
export const PLAYBOOK_MIN_CONFIDENCE_FOR_PROMO = 0.65;
export const PLAYBOOK_DEMOTE_SUCCESS_BELOW = 1 - PLAYBOOK_DEMOTION_MIN_RECENT_SUCCESS_RATE;
export const PLAYBOOK_MIN_EXECUTIONS_BEFORE_DEMOTE = PLAYBOOK_DEMOTION_MIN_EXECUTIONS;
export const PLAYBOOK_RISK_SCORE_FAIL = 0.92;

export const SCORE_BAND_THRESHOLDS = {
  elite: 0.82,
  high: 0.62,
  medium: 0.38,
} as const;

export const MAX_RECOMMENDATIONS = 12;
export const DEFAULT_AUTONOMY_BY_DOMAIN: Record<string, "RECOMMEND_ONLY" | "HUMAN_APPROVAL"> = {
  MESSAGING: "RECOMMEND_ONLY",
  RISK: "RECOMMEND_ONLY",
  GROWTH: "HUMAN_APPROVAL",
  PRICING: "HUMAN_APPROVAL",
  LEADS: "HUMAN_APPROVAL",
  DEALS: "HUMAN_APPROVAL",
  LISTINGS: "HUMAN_APPROVAL",
  PROMOTIONS: "HUMAN_APPROVAL",
  BOOKINGS: "HUMAN_APPROVAL",
  BROKER_ROUTING: "HUMAN_APPROVAL",
};
