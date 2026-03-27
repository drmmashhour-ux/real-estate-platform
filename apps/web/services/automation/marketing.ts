/**
 * Enterprise marketing automation — assisted suggestions only; human approves sends and spend.
 * Log actions in CRM / audit when wiring outbound channels.
 */

import { buildDailyAutopilotBrief } from "@/services/growth/ai-autopilot";
import { buildAdvancedAutopilotBrief } from "@/services/growth/ai-autopilot-advanced";
import type { ChannelPerformanceRow } from "@/services/growth/ai-autopilot";
import type { CityPerformanceRow } from "@/lib/growth/bnhub-city-performance";
import type { NetworkEffectSnapshot } from "@/lib/growth/network-effects";

export type MarketingAutomationContext = {
  area?: string;
  channels?: ChannelPerformanceRow[];
  cityRows?: CityPerformanceRow[];
  network?: NetworkEffectSnapshot | null;
};

/** Daily content + outreach + ad angles (deterministic). */
export function getAssistedMarketingBrief(date = new Date(), ctx: MarketingAutomationContext = {}) {
  const area = ctx.area ?? "Montreal";
  return buildAdvancedAutopilotBrief(
    date,
    area,
    ctx.channels ?? [],
    ctx.cityRows ?? [],
    ctx.network ?? null
  );
}

/** Re-export simple daily pack without advanced inputs. */
export function getStandardMarketingBrief(date = new Date(), area = "Montreal") {
  return buildDailyAutopilotBrief(date, area);
}
