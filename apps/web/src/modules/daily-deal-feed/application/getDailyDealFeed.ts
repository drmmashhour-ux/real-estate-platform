import { prisma } from "@/lib/db";
import { rankDailyDeals } from "@/src/modules/daily-deal-feed/infrastructure/dealFeedRankingService";
import { groupFeedItems } from "@/src/modules/daily-deal-feed/infrastructure/dealFeedGroupingService";
import { buildDealSummary } from "@/src/modules/daily-deal-feed/infrastructure/dealFeedSummaryService";
import type { DailyDealCandidate, DailyDealFeed, FeedInteractionSignal, FeedPreferences } from "@/src/modules/daily-deal-feed/domain/dailyDealFeed.types";

type Args = {
  userId: string;
  workspaceId?: string | null;
  limit?: number;
};

function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function confidenceFromAnalysis(value: number | null): number {
  if (value == null) return 40;
  return Math.max(0, Math.min(100, Math.round(value)));
}

async function loadPreferences(userId: string): Promise<FeedPreferences | null> {
  const pref = await prisma.userFeedPreference.findUnique({ where: { userId } });
  if (!pref) return null;
  return {
    userId,
    preferredCities: (pref.preferredCities as string[] | null) ?? [],
    preferredPropertyTypes: (pref.preferredPropertyTypes as string[] | null) ?? [],
    preferredModes: (pref.preferredModes as string[] | null) ?? [],
    budgetMin: pref.budgetMin,
    budgetMax: pref.budgetMax,
    strategyMode: (pref.strategyMode as FeedPreferences["strategyMode"]) ?? null,
    riskTolerance: (pref.riskTolerance as FeedPreferences["riskTolerance"]) ?? null,
  };
}

async function loadInteractions(userId: string): Promise<FeedInteractionSignal[]> {
  const rows = await prisma.feedInteraction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: { listingId: true, interactionType: true, createdAt: true },
  });
  return rows as FeedInteractionSignal[];
}

async function loadCandidates(limit: number): Promise<DailyDealCandidate[]> {
  const listings = await prisma.fsboListing.findMany({
    where: { status: "ACTIVE", moderationStatus: "APPROVED" },
    orderBy: { updatedAt: "desc" },
    take: Math.max(limit * 3, 60),
    select: {
      id: true,
      title: true,
      city: true,
      propertyType: true,
      listingDealType: true,
      priceCents: true,
      images: true,
      trustScore: true,
      riskScore: true,
      updatedAt: true,
    },
  });
  const ids = listings.map((x) => x.id);
  const analyses = ids.length
    ? await prisma.dealAnalysis.findMany({
        where: { propertyId: { in: ids } },
        distinct: ["propertyId"],
        orderBy: { createdAt: "desc" },
        select: { propertyId: true, investmentScore: true, confidenceScore: true },
      })
    : [];

  const byListing = new Map(analyses.map((a) => [a.propertyId ?? "", a]));
  const now = Date.now();

  return listings.map((l) => {
    const a = byListing.get(l.id);
    const updatedMs = l.updatedAt.getTime();
    const freshnessDays = Math.max(0, Math.floor((now - updatedMs) / 86_400_000));
    return {
      listingId: l.id,
      title: l.title,
      city: l.city,
      propertyType: l.propertyType,
      listingMode: l.listingDealType,
      priceCents: l.priceCents,
      imageUrl: l.images?.[0] ?? null,
      dealScore: a?.investmentScore ?? 45,
      trustScore: l.trustScore ?? 45,
      riskScore: l.riskScore ?? 35,
      confidence: confidenceFromAnalysis(a?.confidenceScore ?? null),
      freshnessDays,
      updatedAt: l.updatedAt,
    };
  });
}

export async function getDailyDealFeed(args: Args): Promise<DailyDealFeed> {
  const limit = Math.max(12, Math.min(60, args.limit ?? 24));
  const dateKey = todayKey();

  const existing = await prisma.dailyDealFeedSnapshot.findFirst({
    where: {
      userId: args.userId,
      generatedForDate: new Date(dateKey),
      feedType: "user",
    },
    include: {
      items: {
        orderBy: { rankPosition: "asc" },
        include: {
          listing: {
            select: { title: true, city: true, priceCents: true, images: true, propertyType: true, listingDealType: true },
          },
        },
      },
    },
  });

  if (existing && existing.items.length > 0) {
    const items = existing.items.map((x) => ({
      listingId: x.listingId,
      title: x.listing?.title ?? "Listing",
      city: x.listing?.city ?? "",
      propertyType: x.listing?.propertyType ?? null,
      listingMode: x.listing?.listingDealType ?? null,
      priceCents: x.listing?.priceCents ?? 0,
      imageUrl: x.listing?.images?.[0] ?? null,
      dealScore: x.dealScore,
      trustScore: x.trustScore,
      riskScore: 35,
      confidence: x.confidence,
      freshnessDays: 0,
      updatedAt: x.createdAt,
      score: x.score,
      bucket: x.feedBucket as any,
      rankPosition: x.rankPosition,
      breakdown: { deal: 0, trust: 0, personalization: 0, freshness: 0, confidence: 0, engagement: 0, penalties: 0 },
      explanation: {
        headline: (x.explanation as any)?.headline ?? "Worth reviewing",
        detail: (x.explanation as any)?.detail ?? "Deterministic scoring snapshot.",
        confidenceNote: (x.explanation as any)?.confidenceNote ?? "",
      },
      badges: [],
      isNewToUser: false,
    }));
    const sections = groupFeedItems(items as any);
    return {
      generatedForDate: dateKey,
      feedType: "user",
      itemCount: items.length,
      hero: (items[0] as any) ?? null,
      sections,
      retentionHooks: ["Updated since your last visit", "Based on your recent activity"],
    };
  }

  const [preferences, interactions, candidates, user] = await Promise.all([
    loadPreferences(args.userId),
    loadInteractions(args.userId),
    loadCandidates(limit),
    prisma.user.findUnique({ where: { id: args.userId }, select: { role: true, marketplacePersona: true } }),
  ]);

  const ranked = rankDailyDeals({
    candidates,
    preferences,
    interactions,
    onboardingRole: user?.marketplacePersona?.toLowerCase() ?? user?.role?.toLowerCase() ?? null,
  })
    .slice(0, limit)
    .map((item, idx) => ({ ...item, rankPosition: idx + 1, explanation: buildDealSummary(item) }));

  const sections = groupFeedItems(ranked);

  await prisma.dailyDealFeedSnapshot
    .create({
      data: {
        userId: args.userId,
        workspaceId: args.workspaceId ?? null,
        generatedForDate: new Date(dateKey),
        feedType: "user",
        itemCount: ranked.length,
        items: {
          create: ranked.map((item) => ({
            listingId: item.listingId,
            rankPosition: item.rankPosition,
            feedBucket: item.bucket,
            score: item.score,
            trustScore: item.trustScore,
            dealScore: item.dealScore,
            confidence: item.confidence,
            explanation: item.explanation as unknown as object,
          })),
        },
      },
    })
    .catch(() => {});

  const retentionHooks = [
    ranked.some((r) => r.isNewToUser) ? "New deals today" : "Top deals refreshed",
    interactions.length > 0 ? "Based on your recent activity" : "Smart defaults while we learn your preferences",
    "Updated since your last visit",
  ];

  return {
    generatedForDate: dateKey,
    feedType: "user",
    itemCount: ranked.length,
    hero: ranked[0] ?? null,
    sections,
    retentionHooks,
  };
}
