import { BookingStatus, ListingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logWarn } from "@/lib/logger";
import { marketplaceIntelligenceFlags } from "@/config/feature-flags";
import { computeListingQualityScore } from "./listing-quality.service";
import { computeListingTrustScore } from "./listing-trust.service";
import { detectFraudSignals } from "./fraud-signal.service";
import { recommendListingPrice } from "./pricing-intelligence.service";
import { computeMarketplaceRankingScore } from "./ranking-engine.service";
import { buildMarketplaceDecisions } from "./marketplace-decision.service";
import * as repo from "./marketplace-intelligence.repository";
import type {
  FraudSignal,
  ListingQualityScore,
  ListingTrustScore,
  MarketplaceRankingScore,
  PricingRecommendation,
  MarketplaceDecision,
} from "./marketplace-intelligence.types";
import { maybeIngestMarketplaceLearning } from "@/modules/growth/unified-learning.service";

export type MarketplaceIntelligenceRunSummary = {
  listingId: string;
  quality: ListingQualityScore;
  trust: ListingTrustScore;
  fraudSignals: FraudSignal[];
  pricing: PricingRecommendation | null;
  ranking: MarketplaceRankingScore;
  decisions: MarketplaceDecision[];
  persistWarnings: string[];
  info: string[];
};

function jsonToStringArray(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map((x) => String(x));
  if (typeof raw === "string") {
    try {
      const p = JSON.parse(raw) as unknown;
      return Array.isArray(p) ? p.map((x) => String(x)) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function buildScoringListingPayload(
  row: {
    id: string;
    title: string;
    description: string | null;
    descriptionFr: string | null;
    photos: unknown;
    amenities: unknown;
    nightPriceCents: number;
    city: string;
    address: string;
    maxGuests: number;
    ownerId: string;
    createdAt: Date;
    updatedAt: Date;
  },
  photoCount: number,
) {
  const photos = jsonToStringArray(row.photos);
  const amenities = jsonToStringArray(row.amenities);
  const description =
    [row.description, row.descriptionFr].find((d) => d && String(d).length >= 80) ?? row.description ?? row.descriptionFr ?? "";

  return {
    id: row.id,
    title: row.title,
    description: String(description),
    photos: photoCount > 0 ? Array.from({ length: photoCount }, (_, i) => photos[i] ?? `p${i}`) : photos,
    amenities: amenities.length ? amenities : Array.from({ length: 0 }),
    pricePerNight: row.nightPriceCents / 100,
    city: row.city,
    address: row.address,
    maxGuests: row.maxGuests,
    hostUserId: row.ownerId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function computePriceFit(currentNightly: number, marketMedianNightly: number | null): number {
  if (!marketMedianNightly || marketMedianNightly <= 0) return 50;
  const ratio = currentNightly / marketMedianNightly;
  if (ratio >= 0.92 && ratio <= 1.08) return 78;
  if (ratio >= 0.85 && ratio <= 1.15) return 64;
  return Math.max(25, Math.round(100 - Math.min(75, Math.abs(1 - ratio) * 90)));
}

function computeFreshnessScore(updatedAt: Date): number {
  const days = (Date.now() - updatedAt.getTime()) / 86_400_000;
  return Math.round(Math.max(28, Math.min(100, 100 - Math.min(72, days * 0.4))));
}

export async function runMarketplaceIntelligenceForListing(listingId: string): Promise<MarketplaceIntelligenceRunSummary | null> {
  if (!marketplaceIntelligenceFlags.marketplaceIntelligenceV1) {
    return null;
  }

  const info: string[] = [];
  const persistWarnings: string[] = [];

  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    include: {
      owner: { include: { userVerificationProfile: true } },
      reviews: { take: 80, select: { comment: true } },
      listingPhotos: { select: { id: true } },
      listingSearchMetrics: true,
    },
  });

  if (!listing) {
    logWarn("[marketplace-intelligence] listing not found", { listingId });
    return null;
  }

  const photoCount = Math.max(listing.listingPhotos.length, jsonToStringArray(listing.photos).length);
  const scoringListing = buildScoringListingPayload(listing, photoCount);

  const quality = computeListingQualityScore(scoringListing);

  const verification = {
    hostVerified: listing.bnhubListingHostVerified === true,
    emailVerified: listing.owner?.userVerificationProfile?.emailVerified === true,
    phoneVerified: listing.owner?.userVerificationProfile?.phoneVerified === true,
  };

  const trust = computeListingTrustScore({
    listing: scoringListing,
    host: listing.owner
      ? {
          ...listing.owner,
          createdAt: listing.owner.createdAt,
          identityVerified: listing.owner.userVerificationProfile?.identityVerified,
        }
      : undefined,
    reviews: listing.reviews,
    verification,
  });

  const similar = await prisma.shortTermListing.findMany({
    where: {
      city: listing.city,
      id: { not: listing.id },
      listingStatus: ListingStatus.PUBLISHED,
    },
    take: 25,
    select: { id: true, title: true },
  });

  const recentBookings = await prisma.booking.findMany({
    where: {
      listingId: listing.id,
      status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
    },
    take: 30,
    orderBy: { createdAt: "desc" },
    select: { id: true, status: true, createdAt: true },
  });

  const hostForFraud = listing.owner
    ? {
        ...listing.owner,
        governmentIdVerified: listing.owner.userVerificationProfile?.identityVerified === true,
        identityVerified: listing.owner.userVerificationProfile?.identityVerified === true,
      }
    : undefined;

  let fraudSignals: FraudSignal[] = [];
  if (marketplaceIntelligenceFlags.marketplaceFraudReviewV1) {
    fraudSignals = detectFraudSignals({
      listing: scoringListing,
      host: hostForFraud,
      similarListings: similar,
      reviews: listing.reviews,
      recentBookings,
    });
  } else {
    info.push("Fraud signals skipped (FEATURE_MARKETPLACE_FRAUD_REVIEW_V1 off).");
  }

  const med = await prisma.shortTermListing.aggregate({
    where: {
      city: listing.city,
      listingStatus: ListingStatus.PUBLISHED,
      id: { not: listing.id },
    },
    _avg: { nightPriceCents: true },
  });
  const marketMedian = med._avg.nightPriceCents ? med._avg.nightPriceCents / 100 : null;

  const metrics = listing.listingSearchMetrics;
  const views = metrics?.views30d ?? null;
  const bookings = metrics?.bookings30d ?? null;
  const conversionRate = metrics?.conversionRate ?? null;

  let pricing: PricingRecommendation | null = null;
  if (marketplaceIntelligenceFlags.marketplacePricingIntelligenceV1) {
    pricing = recommendListingPrice({
      listing: scoringListing,
      marketMedian,
      occupancyRate: null,
      conversionRate,
      views,
      bookings,
    });
  } else {
    info.push("Pricing recommendations skipped (FEATURE_MARKETPLACE_PRICING_INTELLIGENCE_V1 off).");
  }

  const currentNightly = listing.nightPriceCents / 100;
  const conversionScore =
    typeof conversionRate === "number" && !Number.isNaN(conversionRate)
      ? Math.round(Math.max(0, Math.min(100, conversionRate * 100)))
      : metrics?.ctr != null
        ? Math.round(Math.min(100, metrics.ctr * 100))
        : 50;
  const priceFitScore = computePriceFit(currentNightly, marketMedian);
  const freshnessScore = computeFreshnessScore(listing.updatedAt);

  let ranking: MarketplaceRankingScore;
  if (marketplaceIntelligenceFlags.marketplaceRankingSignalsV1) {
    ranking = computeMarketplaceRankingScore({
      listingId: listing.id,
      qualityScore: quality.score,
      trustScore: trust.score,
      conversionScore,
      priceFitScore,
      freshnessScore,
    });
  } else {
    ranking = computeMarketplaceRankingScore({
      listingId: listing.id,
      qualityScore: quality.score,
      trustScore: trust.score,
      conversionScore: null,
      priceFitScore: null,
      freshnessScore: null,
    });
    info.push("Ranking snapshot uses neutral defaults (FEATURE_MARKETPLACE_RANKING_SIGNALS_V1 off).");
  }

  const decisions = buildMarketplaceDecisions({
    quality,
    trust,
    ranking,
    fraudSignals,
    pricingRecommendation: pricing,
  });

  const meta = { source: "marketplace_intelligence_v6_orchestrator" as const };

  const qSave = await repo.saveListingQualitySnapshot(quality, meta);
  if (!qSave) persistWarnings.push("quality_snapshot_failed");

  if (marketplaceIntelligenceFlags.marketplaceTrustScoringV1) {
    const tSave = await repo.saveListingTrustSnapshot(trust, meta);
    if (!tSave) persistWarnings.push("trust_snapshot_failed");
  } else {
    info.push("Trust snapshot not persisted (FEATURE_MARKETPLACE_TRUST_SCORING_V1 off).");
  }

  if (marketplaceIntelligenceFlags.marketplaceFraudReviewV1 && fraudSignals.length) {
    const fr = await repo.saveFraudSignals(fraudSignals);
    persistWarnings.push(...fr.warnings.map((w) => `fraud:${w.message}`));
  }

  if (marketplaceIntelligenceFlags.marketplaceRankingSignalsV1) {
    const rSave = await repo.saveRankingSnapshot(ranking, meta);
    if (!rSave) persistWarnings.push("ranking_snapshot_failed");
  }

  if (marketplaceIntelligenceFlags.marketplacePricingIntelligenceV1 && pricing) {
    const pSave = await repo.savePricingRecommendation(pricing);
    if (!pSave) persistWarnings.push("pricing_recommendation_failed");
  }

  const dSave = await repo.saveMarketplaceDecisions(decisions);
  persistWarnings.push(...dSave.warnings.map((w) => `decision:${w.message}`));

  maybeIngestMarketplaceLearning({
    listingId: listing.id,
    rankingScore: ranking.score,
    trustScore: trust.score,
    fraudHigh: fraudSignals.some((s) => s.severity === "HIGH"),
    pricingAdjusted: pricing != null && Math.abs(pricing.adjustmentPercent) >= 0.05,
  });

  return {
    listingId: listing.id,
    quality,
    trust,
    fraudSignals,
    pricing,
    ranking,
    decisions,
    persistWarnings,
    info,
  };
}

export async function runMarketplaceIntelligenceBatch(listingIds: string[]): Promise<{
  ok: number;
  failed: string[];
  summaries: MarketplaceIntelligenceRunSummary[];
}> {
  const failed: string[] = [];
  const summaries: MarketplaceIntelligenceRunSummary[] = [];
  for (const id of listingIds) {
    try {
      const s = await runMarketplaceIntelligenceForListing(id);
      if (s) summaries.push(s);
      else failed.push(id);
    } catch (e) {
      logWarn("[marketplace-intelligence] batch item failed", { listingId: id, error: String(e) });
      failed.push(id);
    }
  }
  return { ok: summaries.length, failed, summaries };
}
