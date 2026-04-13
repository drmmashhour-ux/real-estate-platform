import type { ContentMachineStyle } from "@prisma/client";
import { prisma } from "@/lib/db";
import { legacyScoreFromRow } from "./scoring";
import type { CityStyleStat, ExtendedOptimizationSignals } from "./types";
import { extractCtaBucket, extractVisualOrderKey } from "./signals";

function scoreRow(r: {
  views: number;
  clicks: number;
  conversions: number;
  saves: number;
  shares: number;
  bookings: number;
  revenueCents: number;
  performanceScore: number | null;
}): number {
  if (r.performanceScore != null && Number.isFinite(r.performanceScore)) {
    return r.performanceScore;
  }
  return legacyScoreFromRow(r);
}

/**
 * Top percentile cohort analysis — drives optimization + learning prompts.
 * Compatible with existing `ContentOptimizationSignals` consumers.
 */
export async function analyzeOptimizationSignals(
  percentileFraction = 0.1
): Promise<ExtendedOptimizationSignals | null> {
  const clamped = Math.min(0.5, Math.max(0.02, percentileFraction));
  const rows = await prisma.machineGeneratedContent.findMany({
    select: {
      id: true,
      listingId: true,
      style: true,
      hook: true,
      script: true,
      caption: true,
      views: true,
      clicks: true,
      conversions: true,
      saves: true,
      shares: true,
      bookings: true,
      revenueCents: true,
      performanceScore: true,
      metadataJson: true,
    },
  });

  if (rows.length < 5) return null;

  const listings = await prisma.shortTermListing.findMany({
    where: { id: { in: [...new Set(rows.map((r) => r.listingId))] } },
    select: { id: true, city: true, region: true, nightPriceCents: true },
  });
  const listingById = new Map(listings.map((l) => [l.id, l] as const));

  const scored = rows.map((r) => ({
    ...r,
    score: scoreRow(r),
  }));
  scored.sort((a, b) => b.score - a.score);

  const k = Math.max(1, Math.ceil(rows.length * clamped));
  const cohort = scored.slice(0, k);
  const bottom = scored.slice(-Math.max(1, Math.ceil(rows.length * clamped))).reverse();

  const cohortScoreSum = cohort.reduce((s, r) => s + r.score, 0);
  if (cohortScoreSum <= 0) return null;

  const styleAgg = new Map<ContentMachineStyle, { scoreSum: number; count: number }>();
  for (const r of cohort) {
    const cur = styleAgg.get(r.style) ?? { scoreSum: 0, count: 0 };
    cur.scoreSum += r.score;
    cur.count += 1;
    styleAgg.set(r.style, cur);
  }
  const stylesRanked = [...styleAgg.entries()]
    .map(([style, v]) => ({ style, scoreSum: v.scoreSum, count: v.count }))
    .sort((a, b) => b.scoreSum - a.scoreSum);

  const seenHooks = new Set<string>();
  const hookExamples: string[] = [];
  for (const r of cohort) {
    const h = r.hook.trim();
    if (!h || seenHooks.has(h)) continue;
    seenHooks.add(h);
    hookExamples.push(h.slice(0, 512));
    if (hookExamples.length >= 15) break;
  }

  const worstSeen = new Set<string>();
  const worstHookExamples: string[] = [];
  for (const r of bottom) {
    const h = r.hook.trim();
    if (!h || worstSeen.has(h)) continue;
    worstSeen.add(h);
    worstHookExamples.push(h.slice(0, 256));
    if (worstHookExamples.length >= 10) break;
  }

  const ctaMap = new Map<string, { scoreSum: number; count: number }>();
  for (const r of cohort) {
    const bucket = extractCtaBucket(r.script, r.caption);
    const cur = ctaMap.get(bucket) ?? { scoreSum: 0, count: 0 };
    cur.scoreSum += r.score;
    cur.count += 1;
    ctaMap.set(bucket, cur);
  }
  const ctaBuckets = [...ctaMap.entries()]
    .map(([bucket, v]) => ({ bucket, scoreSum: v.scoreSum, count: v.count }))
    .sort((a, b) => b.scoreSum - a.scoreSum);

  const voMap = new Map<string, { scoreSum: number; count: number }>();
  for (const r of cohort) {
    const key = extractVisualOrderKey(r.metadataJson);
    const cur = voMap.get(key) ?? { scoreSum: 0, count: 0 };
    cur.scoreSum += r.score;
    cur.count += 1;
    voMap.set(key, cur);
  }
  const visualOrderStats = [...voMap.entries()]
    .map(([key, v]) => ({ key, avgScore: v.scoreSum / Math.max(1, v.count), count: v.count }))
    .sort((a, b) => b.avgScore - a.avgScore);

  const cityAgg = new Map<string, { styles: Map<ContentMachineStyle, number>; scoreSum: number; pieces: number }>();
  for (const r of cohort) {
    const L = listingById.get(r.listingId);
    const cityKey = normalizeCityKey(L?.city);
    if (!cityKey) continue;
    const cur = cityAgg.get(cityKey) ?? { styles: new Map(), scoreSum: 0, pieces: 0 };
    cur.styles.set(r.style, (cur.styles.get(r.style) ?? 0) + r.score);
    cur.scoreSum += r.score;
    cur.pieces += 1;
    cityAgg.set(cityKey, cur);
  }
  const cityStyleHints = [...cityAgg.entries()]
    .map(([cityKey, v]) => {
      const top = [...v.styles.entries()].sort((a, b) => b[1] - a[1])[0];
      if (!top) return null;
      return {
        cityKey,
        topStyle: top[0],
        scoreSum: v.scoreSum,
        pieces: v.pieces,
      };
    })
    .filter((x): x is CityStyleStat => x != null)
    .sort((a, b) => b.scoreSum - a.scoreSum)
    .slice(0, 24);

  const cohortListingIds = [...new Set(cohort.map((r) => r.listingId))];

  return {
    percentile: clamped,
    cohortSize: cohort.length,
    totalPieces: rows.length,
    cohortScoreSum,
    stylesRanked,
    hookExamples,
    cohortListingIds,
    ctaBuckets,
    visualOrderStats,
    cityStyleHints,
    worstHookExamples,
  };
}

export async function getTopMachineContentByScore(limit = 30) {
  const rows = await prisma.machineGeneratedContent.findMany({
    take: Math.min(limit * 6, 600),
    orderBy: { updatedAt: "desc" },
    include: {
      listing: { select: { id: true, title: true, listingCode: true, city: true, nightPriceCents: true } },
    },
  });
  const sorted = [...rows].sort((a, b) => {
    const sa = a.performanceScore ?? legacyScoreFromRow(a);
    const sb = b.performanceScore ?? legacyScoreFromRow(b);
    return sb - sa;
  });
  return sorted.slice(0, limit);
}

export async function getWorstMachineContentByScore(limit = 30) {
  const rows = await prisma.machineGeneratedContent.findMany({
    take: Math.min(limit * 6, 600),
    orderBy: { updatedAt: "desc" },
    include: {
      listing: { select: { id: true, title: true, listingCode: true, city: true, nightPriceCents: true } },
    },
  });
  const sorted = [...rows].sort((a, b) => {
    const sa = a.performanceScore ?? legacyScoreFromRow(a);
    const sb = b.performanceScore ?? legacyScoreFromRow(b);
    return sa - sb;
  });
  return sorted.slice(0, limit);
}

function normalizeCityKey(city: string | undefined): string {
  if (!city?.trim()) return "";
  return city.trim().toLowerCase().replace(/\s+/g, "_");
}
