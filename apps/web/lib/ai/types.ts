/**
 * Shared autonomy / Manager AI vocabulary for platform settings.
 * Kept free of Prisma — safe to import from API routes and client components.
 */
import type { AgentKey } from "@/modules/agents/executive-router";

export type { AgentKey };

/** Persisted `globalMode` strings (Manager AI platform settings + backward-compatible aliases). */
export const AUTOPILOT_MODES = [
  "APPROVAL_AUTOPILOT",
  "ASSIST",
  "ASSISTANT",
  "ASSIST_ONLY",
  "AUTONOMOUS_MAX_WITH_OVERRIDE",
  "AUTONOMOUS_SAFE",
  "FULL_AUTOPILOT_APPROVAL",
  "OFF",
  "RECOMMENDATIONS",
  "RECOMMENDATIONS_ONLY",
  "SAFE_AUTOPILOT",
  "SEMI_AUTONOMOUS",
] as const;

export type AutopilotMode = (typeof AUTOPILOT_MODES)[number];

const MODE_SET = new Set<string>(AUTOPILOT_MODES);

const MODE_ALIASES: Record<string, AutopilotMode> = {
  assist: "ASSIST_ONLY",
  ASSIST: "ASSIST_ONLY",
  manual: "OFF",
  recommendations: "RECOMMENDATIONS",
  full: "FULL_AUTOPILOT_APPROVAL",
  full_autopilot: "FULL_AUTOPILOT_APPROVAL",
  full_with_approval: "AUTONOMOUS_MAX_WITH_OVERRIDE",
};

export function normalizeAutonomyMode(raw: string): AutopilotMode {
  const t = raw.trim();
  if (MODE_SET.has(t)) return t as AutopilotMode;
  const alias = MODE_ALIASES[t] ?? MODE_ALIASES[t.toLowerCase()];
  if (alias) return alias;
  return "ASSISTANT";
}
