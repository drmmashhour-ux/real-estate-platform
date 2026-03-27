/**
 * Advanced growth autopilot — heuristics for 10K → 100K (no mandatory ML).
 * Pair with human review for ad spend and creative. See docs/100k-domination-system.md.
 */

import { buildDailyAutopilotBrief, identifyHighPerformingChannels, suggestAdCreatives } from "./ai-autopilot";
import type { ChannelPerformanceRow } from "./ai-autopilot";
import { suggestNightlyPriceCents } from "@/lib/growth/host-onboarding-playbook";
import type { CityPerformanceRow } from "@/lib/growth/bnhub-city-performance";
import type { NetworkEffectSnapshot } from "@/lib/growth/network-effects";

export type FunnelSnapshot = {
  visits: number;
  signups: number;
  bookings: number;
};

export function detectDropOffsAndSuggestFixes(prev: FunnelSnapshot, curr: FunnelSnapshot): string[] {
  const out: string[] = [];
  const vs = prev.visits && curr.visits ? curr.visits / prev.visits - 1 : 0;
  const ss = prev.signups && curr.signups ? curr.signups / prev.signups - 1 : 0;
  const bs = prev.bookings && curr.bookings ? curr.bookings / prev.bookings - 1 : 0;

  if (vs < -0.15) out.push("Traffic down >15%: check ad delivery, SEO rankings, and top landing LCP.");
  if (vs >= 0 && ss < -0.2) out.push("Signups lagging traffic: simplify signup, strengthen trust above fold, retarget warm visitors.");
  if (ss >= 0 && bs < -0.15) out.push("Bookings not keeping up: supply in top cities, pricing clarity, checkout friction audit.");
  if (out.length === 0) out.push("Funnel stable week-over-week — scale winning creatives + host supply in strongest cities.");
  return out;
}

export function suggestPricingStrategyFromComps(medianPeerNightlyCents: number, occupancyHint: "low" | "mid" | "high") {
  const tier = occupancyHint === "high" ? "premium" : occupancyHint === "low" ? "economy" : "standard";
  const suggested = suggestNightlyPriceCents(medianPeerNightlyCents, tier);
  const tip =
    occupancyHint === "low"
      ? "Consider short promos + min-stay tweaks before structural price cuts."
      : occupancyHint === "high"
        ? "Test +5–8% on weekends; keep base aligned with comps."
        : "Match median; differentiate with photos and instant book.";
  return { suggestedNightlyCents: suggested, tier, tip };
}

export function optimizeAdsHeuristic(input: {
  spendCents: number;
  signups: number;
  targetCacCents: number | null;
}): string[] {
  const cac = input.signups > 0 ? input.spendCents / input.signups : null;
  const out: string[] = [];
  if (cac != null && input.targetCacCents && cac > input.targetCacCents * 1.2) {
    out.push("CAC above target: pause bottom 30% ad sets; tighten geo to liquid cities.");
  } else if (cac != null && input.targetCacCents && cac < input.targetCacCents * 0.8) {
    out.push("CAC healthy: duplicate winning ad set and +10–15% budget on top creative.");
  } else {
    out.push("Hold budget; run 2 new hooks against control this week.");
  }
  return out;
}

export function identifyGrowthOpportunitiesFromCities(
  rows: CityPerformanceRow[],
  minListingsForScale = 15
): string[] {
  const out: string[] = [];
  const weakSupply = rows.filter((r) => r.publishedListings < minListingsForScale);
  const hotDemand = rows.filter((r) => r.bookingsInPeriod >= 3 && r.publishedListings < minListingsForScale * 2);

  for (const r of weakSupply) {
    out.push(`${r.displayName}: host recruitment + agency partnerships (supply < ${minListingsForScale}).`);
  }
  for (const r of hotDemand) {
    out.push(`${r.displayName}: demand signal with constrained supply — paid host LPs + referrals.`);
  }
  if (out.length === 0) out.push("Balance looks even — push guest retargeting in top GMV cities.");
  return out;
}

export type AdvancedAutopilotBrief = ReturnType<typeof buildAdvancedAutopilotBrief>;

export function buildAdvancedAutopilotBrief(
  date = new Date(),
  area = "Montreal",
  channels: ChannelPerformanceRow[] = [],
  cityRows: CityPerformanceRow[] = [],
  network: NetworkEffectSnapshot | null = null,
  funnelPrev: FunnelSnapshot | null = null,
  funnelCurr: FunnelSnapshot | null = null
) {
  const base = buildDailyAutopilotBrief(date, area);
  const ranked = identifyHighPerformingChannels(channels);
  const opportunities = identifyGrowthOpportunitiesFromCities(cityRows);
  const dropoffs =
    funnelPrev && funnelCurr ? detectDropOffsAndSuggestFixes(funnelPrev, funnelCurr) : ["Log visit/signup/booking counts weekly to enable drop-off detection."];

  return {
    ...base,
    channelsRanked: ranked.slice(0, 8),
    growthOpportunities: opportunities,
    dropOffSuggestions: dropoffs,
    adCreativePack: suggestAdCreatives(area),
    pricingExample: suggestPricingStrategyFromComps(150_00, "mid"),
    networkEffectsNote: network
      ? `Bookings per 1k listings (30d): ${network.bookingsPerThousandListings ?? "n/a"} — ${(network.bookingsPerThousandListings ?? 0) < 30 ? "prioritize liquidity" : "scale demand"}.`
      : "Compute network snapshot from admin dashboard.",
  };
}
