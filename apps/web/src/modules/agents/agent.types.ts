/**
 * Marketplace AI v5 — agent façade types (suggestions only; no binding offers).
 */

export type MarketplaceAgentKind = "buyer" | "seller" | "broker" | "host" | "investor";

export type AgentSafeAction =
  | "suggest_autopilot_scan"
  | "suggest_growth_candidate"
  | "suggest_revenue_review"
  | "suggest_trust_verification"
  | "draft_message"
  | "negotiation_hint"
  | "no_action";

export type AgentSuggestion = {
  action: AgentSafeAction;
  title: string;
  description: string;
  payload?: Record<string, unknown>;
  requiresApproval: boolean;
};

export type ExplainableAgentDecision = {
  decision: string;
  reasoning: string[];
  confidence: number;
  dataUsed: string[];
  suggestions: AgentSuggestion[];
};
