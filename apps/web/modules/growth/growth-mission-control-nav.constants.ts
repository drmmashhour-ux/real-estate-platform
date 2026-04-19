/**
 * Deterministic Mission Control navigation — hashes on `/dashboard/growth`, plus explicit admin paths.
 */

import type { MissionControlNavTarget } from "./growth-mission-control-action.types";

/** DOM ids on the growth dashboard — paired with GrowthMachineDashboard `scroll-mt` wrappers. */
export const MISSION_CONTROL_SECTION_ID: Record<MissionControlNavTarget, string | null> = {
  fusion: "growth-mc-fusion",
  governance: "growth-mc-governance",
  governance_console: "growth-mc-governance-console",
  executive: "growth-mc-executive",
  simulation: "growth-mc-simulation",
  strategy: "growth-mc-strategy",
  daily_brief: "growth-mc-daily-brief",
  multi_agent: "growth-mc-multi-agent",
  learning: "growth-mc-learning",
  revenue: "growth-mc-revenue",
  broker_closing: "growth-mc-broker-closing",
  broker_team_admin: null,
  host_bnhub: "growth-mc-host-bnhub",
  cadence: "growth-mc-cadence",
  memory: "growth-mc-memory",
  graph: "growth-mc-graph",
  operating_review: "growth-mc-operating-review",
  policy_enforcement: "growth-mc-policy-enforcement",
};

export function buildMissionControlHref(
  locale: string,
  country: string,
  target: MissionControlNavTarget,
  queryParams?: Record<string, string>,
): string {
  const qs = new URLSearchParams({
    from: "mission-control",
    ...(queryParams ?? {}),
  });

  if (target === "broker_team_admin") {
    return `/${locale}/${country}/admin/broker-team?${qs.toString()}`;
  }

  const base = `/${locale}/${country}/dashboard/growth`;
  const hash = MISSION_CONTROL_SECTION_ID[target];
  if (!hash) return `${base}?${qs.toString()}`;
  return `${base}?${qs.toString()}#${hash}`;
}
