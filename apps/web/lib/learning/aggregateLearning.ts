import { BehaviorEventType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { BEHAVIOR_EVENT_WEIGHTS, MIN_EVENTS_FOR_STRONG_SIGNAL, NEUTRAL_BEHAVIOR_SCORE } from "@/lib/learning/behavior-weights";

const IMPRESSION_TYPES = new Set<BehaviorEventType>([
  "LISTING_IMPRESSION",
  "SEARCH_RESULT_IMPRESSION",
]);

function weightOf(t: BehaviorEventType): number {
  return BEHAVIOR_EVENT_WEIGHTS[t] ?? 0;
}

function smoothBehaviorScore(weightedSum: number, impressions: number, engagements: number): number {
  if (impressions + engagements < MIN_EVENTS_FOR_STRONG_SIGNAL) {
    return NEUTRAL_BEHAVIOR_SCORE + Math.tanh(weightedSum / 120) * 0.08;
  }
  const ratio = engagements / Math.max(1, impressions);
  const w = 0.42 + Math.tanh(weightedSum / 90) * 0.28 + Math.min(0.2, ratio * 0.35);
  return Math.min(0.95, Math.max(0.35, w));
}

function segmentKey(city: string | null | undefined, propertyType: string | null | undefined, priceCents: number | null | undefined): string {
  const c = (city ?? "unknown").toLowerCase().slice(0, 64);
  const pt = (propertyType ?? "any").toLowerCase().slice(0, 32);
  const band =
    priceCents != null && priceCents > 0
      ? priceCents < 12_000
        ? "low"
        : priceCents < 22_000
          ? "mid"
          : "high"
      : "unknown";
  return `${c}|stay|${pt}|${band}`;
}

type Agg = {
  weighted: number;
  impressions: number;
  engagements: number;
  weighted7: number;
  weightedPrev7: number;
};

/**
 * Aggregates `UserBehaviorEvent` rows into `ListingLearningStats`, segment trends, and preference profiles.
 * Intended for cron / internal trigger — not per HTTP search request.
 */
export async function runBehaviorLearningAggregation(): Promise<{
  listingsUpdated: number;
  segmentsUpdated: number;
  profilesTouched: number;
}> {
  const now = Date.now();
  const d30 = new Date(now - 30 * 86400000);
  const d7 = new Date(now - 7 * 86400000);
  const d14 = new Date(now - 14 * 86400000);

  const events = await prisma.userBehaviorEvent.findMany({
    where: {
      createdAt: { gte: d30 },
      listingId: { not: null },
    },
    select: {
      listingId: true,
      eventType: true,
      city: true,
      propertyType: true,
      priceCents: true,
      userId: true,
      sessionId: true,
      createdAt: true,
    },
  });

  const byListing = new Map<string, Agg>();
  const bySegment = new Map<string, { imp: number; eng: number; w: number }>();

  for (const e of events) {
    if (!e.listingId) continue;
    const w = weightOf(e.eventType);
    const agg =
      byListing.get(e.listingId) ??
      ({ weighted: 0, impressions: 0, engagements: 0, weighted7: 0, weightedPrev7: 0 } satisfies Agg);
    agg.weighted += w;
    if (IMPRESSION_TYPES.has(e.eventType)) agg.impressions += 1;
    else if (w > 0 && !IMPRESSION_TYPES.has(e.eventType)) agg.engagements += 1;

    const t = e.createdAt.getTime();
    if (t >= d7.getTime()) agg.weighted7 += w;
    else if (t >= d14.getTime() && t < d7.getTime()) agg.weightedPrev7 += w;

    byListing.set(e.listingId, agg);

    const sk = segmentKey(e.city, e.propertyType, e.priceCents);
    const sg = bySegment.get(sk) ?? { imp: 0, eng: 0, w: 0 };
    if (IMPRESSION_TYPES.has(e.eventType)) sg.imp += 1;
    else if (w > 0) sg.eng += 1;
    sg.w += w;
    bySegment.set(sk, sg);
  }

  let listingsUpdated = 0;
  for (const [listingId, agg] of byListing) {
    const behaviorScore = smoothBehaviorScore(agg.weighted, agg.impressions, agg.engagements);
    const ctr = agg.impressions > 0 ? Math.min(1, agg.engagements / agg.impressions) : null;
    const trendRaw = agg.weighted7 - agg.weightedPrev7;
    const recentTrendScore = 0.5 + Math.tanh(trendRaw / 40) * 0.35;

    const finalLearningScore =
      behaviorScore * 0.55 + Math.min(1, Math.max(0, recentTrendScore)) * 0.45;

    await prisma.listingLearningStats.upsert({
      where: { listingId },
      create: {
        listingId,
        behaviorScore,
        clickThroughRate: ctr,
        recentTrendScore: Math.min(1, Math.max(0, recentTrendScore)),
        finalLearningScore: Math.min(1, Math.max(0, finalLearningScore)),
        totalWeightedEvents: agg.weighted,
        impressionCount30d: agg.impressions,
        engagementCount30d: agg.engagements,
      },
      update: {
        behaviorScore,
        clickThroughRate: ctr,
        recentTrendScore: Math.min(1, Math.max(0, recentTrendScore)),
        finalLearningScore: Math.min(1, Math.max(0, finalLearningScore)),
        totalWeightedEvents: agg.weighted,
        impressionCount30d: agg.impressions,
        engagementCount30d: agg.engagements,
      },
    });
    listingsUpdated += 1;
  }

  let segmentsUpdated = 0;
  for (const [segmentKey, sg] of bySegment) {
    const trend = 0.5 + Math.tanh((sg.w / Math.max(1, sg.imp)) / 8) * 0.35;
    await prisma.marketSegmentLearningStats.upsert({
      where: { segmentKey },
      create: {
        segmentKey,
        impressionCount: sg.imp,
        engagementWeighted: sg.w,
        trendScore: Math.min(1, Math.max(0.2, trend)),
      },
      update: {
        impressionCount: sg.imp,
        engagementWeighted: sg.w,
        trendScore: Math.min(1, Math.max(0.2, trend)),
      },
    });
    segmentsUpdated += 1;
  }

  const clickEvents = events.filter((e) => e.eventType === "LISTING_CLICK" && e.city?.trim());
  let profilesTouched = 0;
  const byUser = new Map<string, Map<string, number>>();
  const bySess = new Map<string, Map<string, number>>();
  for (const e of clickEvents) {
    const city = e.city!.trim().toLowerCase();
    if (e.userId) {
      const m = byUser.get(e.userId) ?? new Map<string, number>();
      m.set(city, (m.get(city) ?? 0) + 1);
      byUser.set(e.userId, m);
    } else {
      const m = bySess.get(e.sessionId) ?? new Map<string, number>();
      m.set(city, (m.get(city) ?? 0) + 1);
      bySess.set(e.sessionId, m);
    }
  }

  async function mergeProfile(
    where: { userId?: string; sessionId?: string },
    cityWeights: Map<string, number>
  ) {
    const arr = [...cityWeights.entries()].map(([key, w]) => ({ key, w }));
    if (arr.length === 0) return;
    const existing = await prisma.behaviorPreferenceProfile.findFirst({ where });
    if (existing) {
      await prisma.behaviorPreferenceProfile.update({
        where: { id: existing.id },
        data: { preferredCitiesJson: arr as object },
      });
    } else if (where.userId) {
      await prisma.behaviorPreferenceProfile.create({
        data: { userId: where.userId, preferredCitiesJson: arr as object },
      });
    } else if (where.sessionId) {
      await prisma.behaviorPreferenceProfile.create({
        data: { sessionId: where.sessionId, preferredCitiesJson: arr as object },
      });
    }
    profilesTouched += 1;
  }

  for (const [uid, m] of byUser) await mergeProfile({ userId: uid }, m);
  for (const [sid, m] of bySess) await mergeProfile({ sessionId: sid }, m);

  return { listingsUpdated, segmentsUpdated, profilesTouched };
}
