import type { ContentItem } from "@/modules/marketing-content/content-calendar.types";
import { rankByPerformance } from "@/modules/marketing-content/content-performance.service";

import type {
  ContentAudience,
  ContentPlatform,
  ContentType,
  PerformanceInsights,
  PlannerWeights,
  PostingTimeSlot,
} from "./marketing-ai.types";

function engagementLike(it: ContentItem): number {
  const p = it.performance;
  const e = p.engagementScore;
  if (e != null && e > 0) return e;
  return p.views + p.clicks * 2 + p.leads * 50 + Math.floor(p.revenueCents / 100);
}

export function analyzePerformanceInsights(items: ContentItem[]): PerformanceInsights {
  const posted = items.filter((i) => i.status === "POSTED");
  if (posted.length === 0) {
    return {
      bestPlatforms: ["INSTAGRAM", "LINKEDIN", "TIKTOK", "YOUTUBE"],
      worstPlatforms: [],
      bestAudiences: ["BROKER", "INVESTOR", "BUYER", "GENERAL"],
      bestTypes: ["VIDEO", "TEXT", "POSTER"],
      weakTypes: [],
      avgLeadsPerPosted: 0,
      avgRevenuePerPostedCents: 0,
    };
  }

  const byPlatform = groupAvg(posted, (i) => i.platform, engagementLike);
  const byAudience = groupAvg(posted, (i) => i.audience, engagementLike);
  const byType = groupAvg(posted, (i) => i.type, engagementLike);

  const platforms = Object.entries(byPlatform).sort((a, b) => b[1] - a[1]);
  const audiences = Object.entries(byAudience).sort((a, b) => b[1] - a[1]);
  const types = Object.entries(byType).sort((a, b) => b[1] - a[1]);

  const leadsSum = posted.reduce((s, i) => s + (i.performance.leads ?? 0), 0);
  const revSum = posted.reduce((s, i) => s + (i.performance.revenueCents ?? 0), 0);

  return {
    bestPlatforms: platforms.slice(0, 2).map(([k]) => k as ContentPlatform),
    worstPlatforms: platforms.slice(-2).map(([k]) => k as ContentPlatform),
    bestAudiences: audiences.slice(0, 2).map(([k]) => k as ContentAudience),
    bestTypes: types.slice(0, 2).map(([k]) => k as ContentType),
    weakTypes: types.slice(-2).map(([k]) => k as ContentType),
    avgLeadsPerPosted: leadsSum / posted.length,
    avgRevenuePerPostedCents: revSum / posted.length,
  };
}

function groupAvg<T extends string>(
  items: ContentItem[],
  keyFn: (i: ContentItem) => T,
  scoreFn: (i: ContentItem) => number
): Record<string, number> {
  const map = new Map<string, { sum: number; n: number }>();
  for (const it of items) {
    const k = keyFn(it);
    const cur = map.get(k) ?? { sum: 0, n: 0 };
    cur.sum += scoreFn(it);
    cur.n += 1;
    map.set(k, cur);
  }
  const out: Record<string, number> = {};
  for (const [k, v] of map) {
    out[k] = v.n ? v.sum / v.n : 0;
  }
  return out;
}

/** Turn insights + ranked items into softmax-ish weights for the planner */
export function buildPlannerWeights(
  insights: PerformanceInsights,
  ranked: ContentItem[]
): PlannerWeights {
  const boost = (x: number) => Math.max(0.15, Math.min(2.5, 0.5 + x / 500));

  const platform: Partial<Record<ContentPlatform, number>> = {};
  for (const p of insights.bestPlatforms) platform[p] = (platform[p] ?? 1) * 1.35;
  for (const p of insights.worstPlatforms) platform[p] = (platform[p] ?? 1) * 0.75;

  const audience: Partial<Record<ContentAudience, number>> = {};
  for (const a of insights.bestAudiences) audience[a] = (audience[a] ?? 1) * 1.25;

  const type: Partial<Record<ContentType, number>> = {};
  for (const t of insights.bestTypes) type[t] = (type[t] ?? 1) * 1.2;
  for (const t of insights.weakTypes) type[t] = (type[t] ?? 1) * 0.85;

  const top = ranked[0];
  if (top) {
    platform[top.platform] = boost(engagementLike(top));
    audience[top.audience] = boost(engagementLike(top));
    type[top.type] = boost(engagementLike(top));
  }

  const slot: Partial<Record<PostingTimeSlot, number>> = {
    morning: 1,
    evening: insights.avgLeadsPerPosted >= 1 ? 1.15 : 1,
  };

  return { platform, audience, type, slot };
}

export function rankItemsForInsights(items: ContentItem[]): ContentItem[] {
  return rankByPerformance(items);
}
