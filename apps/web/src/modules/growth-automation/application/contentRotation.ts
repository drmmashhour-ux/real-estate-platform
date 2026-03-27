import type { GrowthMarketingPlatform } from "@prisma/client";
import type { ContentPillar } from "@/src/modules/growth-automation/domain/contentTaxonomy";
import {
  allowedPillarsForPlatform,
  CONTENT_PILLARS,
} from "@/src/modules/growth-automation/domain/contentTaxonomy";

export type PillarCounts = Record<ContentPillar, number>;

export function emptyPillarCounts(): PillarCounts {
  return {
    mistake: 0,
    education: 0,
    decision: 0,
    demo: 0,
    story: 0,
  };
}

/**
 * Pick next pillar for a slot: must be allowed on platform, avoid consecutive duplicate,
 * prefer pillars under-represented in the last 7-day window.
 */
export function pickPillarForSlot(args: {
  platform: GrowthMarketingPlatform;
  previousPillar: ContentPillar | null;
  countsLast7Days: PillarCounts;
}): ContentPillar {
  const allowed = [...allowedPillarsForPlatform(args.platform)];
  const scored = allowed
    .map((p) => ({
      pillar: p,
      count: args.countsLast7Days[p] ?? 0,
      consecutiveBlocked: args.previousPillar !== null && p === args.previousPillar,
    }))
    .filter((x) => !x.consecutiveBlocked)
    .sort((a, b) => a.count - b.count || a.pillar.localeCompare(b.pillar));

  if (scored.length > 0) {
    return scored[0]!.pillar;
  }

  // No non-consecutive option (e.g. TikTok only [mistake,demo] and previous was one) — pick least-used in allowed.
  const fallback = [...allowed].sort(
    (a, b) => (args.countsLast7Days[a] ?? 0) - (args.countsLast7Days[b] ?? 0),
  );
  return fallback[0] ?? "education";
}

/**
 * Balance score: lower is better (more under-represented pillars get priority globally).
 */
export function balanceScore(counts: PillarCounts): number {
  const vals = CONTENT_PILLARS.map((p) => counts[p] ?? 0);
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  return vals.reduce((acc, v) => acc + (v - mean) ** 2, 0);
}
