/**
 * LECIPM Manager — shared AI operations types (orchestrator, agents, APIs).
 */

export const DECISION_MODES = ["ASSIST_ONLY", "SUGGEST_ONLY", "AUTO_EXECUTE_SAFE", "REQUIRE_APPROVAL"] as const;
export type DecisionMode = (typeof DECISION_MODES)[number];

/** Admin-configurable autonomy (platform + per-agent overrides in JSON). Legacy values remain in DB until migrated. */
export const AUTOPILOT_MODES = [
  "OFF",
  "ASSIST_ONLY",
  "RECOMMENDATIONS_ONLY",
  "SEMI_AUTONOMOUS",
  "AUTONOMOUS_SAFE",
  "AUTONOMOUS_MAX_WITH_OVERRIDE",
  "ASSISTANT",
  "RECOMMENDATIONS",
  "SAFE_AUTOPILOT",
  "APPROVAL_AUTOPILOT",
] as const;
export type AutopilotMode = (typeof AUTOPILOT_MODES)[number];

const LEGACY_AUTONOMY_MAP: Record<string, AutopilotMode> = {
  ASSISTANT: "ASSIST_ONLY",
  RECOMMENDATIONS: "RECOMMENDATIONS_ONLY",
  SAFE_AUTOPILOT: "AUTONOMOUS_SAFE",
  APPROVAL_AUTOPILOT: "AUTONOMOUS_MAX_WITH_OVERRIDE",
};

/** Normalize DB / API strings to canonical autonomy vocabulary. */
export function normalizeAutonomyMode(raw: string | null | undefined): AutopilotMode {
  if (!raw) return "ASSIST_ONLY";
  const u = raw.trim();
  if (LEGACY_AUTONOMY_MAP[u]) return LEGACY_AUTONOMY_MAP[u];
  if ((AUTOPILOT_MODES as readonly string[]).includes(u)) return u as AutopilotMode;
  return "ASSIST_ONLY";
}

export const AGENT_KEYS = [
  "guest_support",
  "host_management",
  "listing_optimization",
  "booking_ops",
  "revenue",
  "trust_safety",
  "admin_insights",
  "compliance",
  "growth",
  "communications",
] as const;
export type AgentKey = (typeof AGENT_KEYS)[number];

export type ManagerAiContext = {
  listingId?: string;
  bookingId?: string;
  role?: string;
  surface?: "web" | "mobile" | "admin";
  /** UI locale hint from client (`en` | `fr` | `ar`); server falls back to user profile. */
  uiLocale?: string;
};

export type RecommendedAction = {
  id: string;
  label: string;
  actionKey: string;
  requiresApproval: boolean;
  payload?: Record<string, unknown>;
};

export type StructuredAgentOutput = {
  summary: string;
  reasoning_short: string;
  confidence: number;
  recommended_actions: RecommendedAction[];
  requiresApproval: boolean;
  disclaimers?: string[];
};

export type OrchestratorResult = {
  reply: string;
  agentKey: AgentKey;
  decisionMode: DecisionMode;
  structured?: StructuredAgentOutput;
  conversationId: string;
};
