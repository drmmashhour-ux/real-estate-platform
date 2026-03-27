export const AI_OPERATOR_CONTEXTS = [
  "deal_analysis",
  "lead_management",
  "drafting",
  "negotiation",
  "growth",
  "monetization",
  /** Team / org workspace snapshot — cross-deal insights and per-broker nudges. */
  "team_workspace",
  /** Workspace deal outcomes → tighten recommendations (no cross-org data). */
  "monopoly_learning",
] as const;

export type AiOperatorContext = (typeof AI_OPERATOR_CONTEXTS)[number];

export const AI_OPERATOR_ACTION_TYPES = [
  "contact_lead",
  "follow_up_lead",
  "run_simulation",
  "adjust_price",
  "generate_draft",
  "send_message",
  "publish_content",
  "trigger_upgrade_prompt",
] as const;

export type AiOperatorActionType = (typeof AI_OPERATOR_ACTION_TYPES)[number];

export const AI_OPERATOR_AUTONOMY_MODES = ["manual", "assisted", "auto_restricted"] as const;

export type AiOperatorAutonomyMode = (typeof AI_OPERATOR_AUTONOMY_MODES)[number];
