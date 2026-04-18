import { prisma } from "@/lib/db";
import { residentialBrokerFsboWhere } from "@/lib/broker/residential-fsbo-scope";
import { detectConversionGaps } from "./conversion-gap.service";
import { listContentNeeds } from "./content-opportunity.service";
import { detectExposureGaps } from "./exposure-gap.service";
import type { ListingMarketingIntelligenceResult } from "./listing-marketing-intelligence.types";
import { scoreListingHealth } from "./listing-performance-scoring.service";

const WINDOW_MS = 30 * 86400000;

export async function computeListingMarketingIntelligence(input: {
  brokerId: string;
  listingId: string;
}): Promise<ListingMarketingIntelligenceResult | null> {
  const listing = await prisma.fsboListing.findFirst({
    where: { id: input.listingId, ...residentialBrokerFsboWhere(input.brokerId) },
    include: { metrics: true },
  });
  if (!listing) return null;

  const start = new Date(Date.now() - WINDOW_MS);
  const end = new Date();

  const [views, saves, inquiriesFsbo, inquiriesCrm] = await Promise.all([
    prisma.buyerListingView.count({
      where: { fsboListingId: listing.id, createdAt: { gte: start, lte: end } },
    }),
    prisma.buyerSavedListing.count({
      where: { fsboListingId: listing.id, createdAt: { gte: start, lte: end } },
    }),
    prisma.fsboLead.count({
      where: { listingId: listing.id, createdAt: { gte: start, lte: end } },
    }),
    prisma.lead.count({
      where: {
        fsboListingId: listing.id,
        introducedByBrokerId: input.brokerId,
        createdAt: { gte: start, lte: end },
      },
    }),
  ]);

  const inquiries = inquiriesFsbo + inquiriesCrm;
  const daysOnMarket = Math.max(0, Math.floor((Date.now() - listing.createdAt.getTime()) / 86400000));

  const scores = scoreListingHealth({
    listing,
    metrics: listing.metrics,
    views,
    inquiries,
  });

  const contentNeeds = listContentNeeds(listing);
  const opportunities = [
    ...detectExposureGaps({ views, saves, daysOnMarket }),
    ...detectConversionGaps({ views, inquiries }),
  ];

  const warnings: string[] = [];
  if (listing.status !== "ACTIVE") {
    warnings.push("Listing is not active — marketing pushes may be premature.");
  }
  if (listing.moderationStatus !== "APPROVED") {
    warnings.push("Moderation is not approved — resolve before paid promotion.");
  }

  const recommendedActions: string[] = [];
  if (contentNeeds.length > 0) {
    recommendedActions.push("Refresh factual description and media using the content checklist.");
  }
  if (opportunities.some((o) => o.includes("inquiries"))) {
    recommendedActions.push("Prepare a broker-reviewed email/SMS draft for saved leads (no urgency claims).");
  }

  return {
    listingId: listing.id,
    healthScore: scores.health,
    exposureScore: scores.exposure,
    conversionScore: scores.conversion,
    contentNeeds,
    opportunities,
    warnings,
    recommendedActions,
    signalSummary: {
      viewsInWindow: views,
      savesInWindow: saves,
      inquiriesInWindow: inquiries,
      daysOnMarket,
      photoCount: listing.images?.length ?? 0,
      hasDescription: (listing.description ?? "").trim().length >= 120,
      qualityScore: listing.metrics?.qualityScore ?? null,
    },
  };
}
