/**
 * LECIPM Full Autopilot — canonical domain definitions (bounded, reviewable).
 * Persisted overrides live in `LecipmFullAutopilotDomainConfig` + orchestration tables.
 */

export type LecipmAutopilotDomainId =
  | "marketing_content_generation"
  | "marketing_scheduling"
  | "marketing_publishing"
  | "lead_routing"
  | "ai_followup_sequences"
  | "booking_slot_suggestion"
  | "no_show_reminders"
  | "post_visit_followups"
  | "broker_assistant_actions"
  | "deal_intelligence_guided_actions"
  | "capital_allocator_recommendations"
  | "marketplace_optimization_proposals"
  | "pricing"
  | "investment_actions"
  | "compliance_actions";

/** Matrix + DB `mode` string (aligned with product; DB uses VarChar). */
export type FullAutopilotMode =
  | "OFF"
  | "ASSIST"
  | "SAFE_AUTOPILOT"
  | "FULL_AUTOPILOT_APPROVAL"
  | "FULL_AUTOPILOT_BOUNDED";

export type AutopilotRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type KillSwitchPosition = "ON" | "OFF" | "LIMITED";

export type AutopilotDomainMatrixRow = {
  domain: LecipmAutopilotDomainId;
  allowedModes: readonly FullAutopilotMode[];
  defaultMode: FullAutopilotMode;
  /** If true, high-risk action types always require approval even in “bounded” modes. */
  requiresApproval: boolean;
  supportsRollback: boolean;
  supportsKillSwitch: boolean;
  riskLevel: AutopilotRiskLevel;
  reason: string;
};
