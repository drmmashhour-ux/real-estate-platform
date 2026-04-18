/**
 * Growth policy enforcement — bounded gating for non-critical advisory flows only (v1).
 */

export type GrowthEnforcementMode =
  | "allow"
  | "advisory_only"
  | "approval_required"
  | "freeze"
  | "block";

export type GrowthEnforcementTarget =
  | "autopilot_advisory_conversion"
  | "autopilot_safe_execution"
  | "learning_adjustments"
  | "content_assist_generation"
  | "messaging_assist_generation"
  | "fusion_autopilot_bridge"
  | "fusion_content_bridge"
  | "fusion_influence_bridge"
  | "simulation_recommendation_promotion"
  | "strategy_recommendation_promotion"
  | "panel_render_hint";

export type GrowthPolicyEnforcementRuleSource = "policy_snapshot" | "governance" | "learning_control";

export type GrowthPolicyEnforcementRule = {
  id: string;
  target: GrowthEnforcementTarget;
  mode: GrowthEnforcementMode;
  rationale: string;
  source: GrowthPolicyEnforcementRuleSource;
  createdAt: string;
};

export type GrowthPolicyEnforcementSnapshot = {
  rules: GrowthPolicyEnforcementRule[];
  blockedTargets: GrowthEnforcementTarget[];
  frozenTargets: GrowthEnforcementTarget[];
  approvalRequiredTargets: GrowthEnforcementTarget[];
  notes: string[];
  createdAt: string;
};

export type GrowthPolicyEnforcementDecision = {
  target: GrowthEnforcementTarget;
  mode: GrowthEnforcementMode;
  rationale: string;
};
