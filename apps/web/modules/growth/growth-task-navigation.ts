/**
 * Safe navigation only — opens internal surfaces with context query params.
 * Never triggers payments, bookings, outbound sends, or mutations.
 */

import type { MissionControlNavTarget } from "@/modules/growth/growth-mission-control-action.types";
import { buildMissionControlHref } from "@/modules/growth/growth-mission-control-nav.constants";

/** Maps `growth:*` surface tokens to Growth Machine DOM ids (`#growth-mc-*`). */
export const GROWTH_SURFACE_TO_SECTION_ID: Record<string, string> = {
  execution_planner: "growth-mc-execution-planner",
  execution_accountability: "growth-mc-execution-accountability",
  weekly_team_review: "growth-mc-weekly-team-review",
  revenue_forecast: "growth-mc-revenue-forecast",
  investor_dashboard: "growth-mc-investor-dashboard",
  team_coordination: "growth-mc-team-coordination",
  fast_deal_city: "growth-mc-fast-deal-city",
  market_expansion: "growth-mc-market-expansion",
  capital_allocation: "growth-mc-capital-allocation",
  weekly_review: "growth-mc-operating-review",
  revenue: "growth-mc-revenue",
  broker_closing: "growth-mc-broker-closing",
  broker_sourcing: "growth-mc-broker-closing",
  city_domination: "growth-mc-city-domination",
  flywheel: "growth-mc-fusion",
  policy_enforcement: "growth-mc-policy-enforcement",
  bnhub_host: "growth-mc-host-bnhub",
};

export type NavigationQuery = {
  from: "execution-planner";
  taskId: string;
};

export function buildExecutionPlannerNavigationHref(params: {
  locale: string;
  country: string;
  taskId: string;
  targetSurface: string;
}): string {
  const { locale, country, taskId, targetSurface } = params;
  const queryParams: Record<string, string> = {
    from: "execution-planner",
    taskId,
  };

  if (targetSurface.startsWith("mission_control:")) {
    const raw = targetSurface.slice("mission_control:".length);
    return buildMissionControlHref(locale, country, raw as MissionControlNavTarget, queryParams);
  }

  if (targetSurface.startsWith("growth:")) {
    const key = targetSurface.slice("growth:".length);
    const hash = GROWTH_SURFACE_TO_SECTION_ID[key];
    const base = `/${locale}/${country}/dashboard/growth`;
    const qs = new URLSearchParams(queryParams);
    if (hash) return `${base}?${qs.toString()}#${hash}`;
    return `${base}?${qs.toString()}`;
  }

  if (targetSurface.startsWith("admin:")) {
    const rest = targetSurface.slice("admin:".length);
    if (rest === "broker_team") {
      return `/${locale}/${country}/admin/broker-team?${new URLSearchParams(queryParams)}`;
    }
  }

  if (targetSurface === "panel:crm" || targetSurface.startsWith("panel:")) {
    const base = `/${locale}/${country}/dashboard/growth`;
    return `${base}?${new URLSearchParams(queryParams)}`;
  }

  const base = `/${locale}/${country}/dashboard/growth`;
  return `${base}?${new URLSearchParams(queryParams)}`;
}

/** Payload for tests / logging — never contains secrets. */
export function navigationPayloadFromSurface(
  locale: string,
  country: string,
  taskId: string,
  targetSurface: string,
): { href: string; query: NavigationQuery } {
  return {
    href: buildExecutionPlannerNavigationHref({ locale, country, taskId, targetSurface }),
    query: { from: "execution-planner", taskId },
  };
}
