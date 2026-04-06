import {
  AiAutopilotActionStatus,
  AiAutopilotActionType,
  AiSuggestionType,
  AutopilotMode,
  AiDecisionDomain,
  ListingAnalyticsKind,
  ListingStatus,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { buildListingSignals } from "@/lib/ai/core/buildListingSignals";
import { calculateDemandScore } from "@/lib/ai/pricing/calculateDemandScore";
import { suggestNightlyPrice } from "@/lib/ai/pricing/suggestNightlyPrice";
import { computeCompositeScore } from "@/lib/ai/intelligence/computeCompositeScore";
import { writeListingIntelligenceSnapshot } from "@/lib/ai/intelligence/writeListingSnapshot";
import { logIntelligenceDecision } from "@/lib/ai/intelligence/logIntelligenceDecision";
import { getOrCreateHostAutopilotSettings } from "@/lib/host/autopilot-settings";
import { createAiSuggestionRow } from "./createSuggestion";

function monthSeasonality(d = new Date()): number {
  const m = d.getMonth();
  if (m >= 5 && m <= 8) return 1.12;
  if (m === 11 || m === 0) return 1.08;
  return 0.95;
}

function weekendBoost(d = new Date()): number {
  const day = d.getUTCDay();
  const daysToSat = (6 - day + 7) % 7;
  return daysToSat <= 2 ? 0.15 : 0.05;
}

export type EvaluateListingResult = {
  listingId: string;
  snapshotId?: string;
  suggestionsCreated: number;
  actionsCreated: number;
};

/**
 * Evaluate one published listing: demand, pricing snapshot, suggestions, optional autopilot actions.
 */
export async function evaluateListingForAutopilot(listingId: string): Promise<EvaluateListingResult> {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    include: {
      owner: { select: { id: true } },
      bnhubHostListingPromotions: { where: { active: true } },
      listingPhotos: { select: { id: true } },
    },
  });
  if (!listing || listing.listingStatus !== ListingStatus.PUBLISHED) {
    return { listingId, suggestionsCreated: 0, actionsCreated: 0 };
  }

  const hostId = listing.ownerId;
  const settings = await getOrCreateHostAutopilotSettings(hostId);

  if (settings.paused || settings.mode === AutopilotMode.OFF) {
    return { listingId, suggestionsCreated: 0, actionsCreated: 0 };
  }

  const analytics = await prisma.listingAnalytics.findFirst({
    where: { listingId, kind: ListingAnalyticsKind.BNHUB },
  });
  const views30 = analytics?.viewsTotal ?? 0;
  const views7 = Math.max(analytics?.views24hCached ?? 0, Math.round(views30 * 0.2));

  const bookings30 = await prisma.booking.count({
    where: {
      listingId,
      createdAt: { gte: new Date(Date.now() - 30 * 86400000) },
      status: { in: ["CONFIRMED", "COMPLETED", "PENDING"] },
    },
  });
  const bookingVelocity = Math.min(5, bookings30 / 10);

  const occRows = await prisma.booking.findMany({
    where: {
      listingId,
      status: { in: ["CONFIRMED", "COMPLETED"] },
      checkOut: { gte: new Date() },
    },
    select: { nights: true },
  });
  const occNights = occRows.reduce((s, r) => s + r.nights, 0);
  const occupancyRate = Math.min(1, occNights / 30);

  const competitionCount = await prisma.shortTermListing.count({
    where: {
      city: listing.city,
      listingStatus: ListingStatus.PUBLISHED,
      id: { not: listing.id },
    },
  });

  const demand = calculateDemandScore({
    views7d: views7,
    views30d: views30,
    bookingVelocity,
    occupancyRate,
    seasonalityMultiplier: monthSeasonality(),
    hasActivePromotion: listing.bnhubHostListingPromotions.length > 0,
    upcomingWeekendBoost: weekendBoost(),
    competitionCount,
  });

  const listingSignals = await buildListingSignals(listingId);

  const currentNightly = listing.nightPriceCents / 100;
  const price = suggestNightlyPrice({
    currentNightly,
    hostSettings: settings,
    demand,
    occupancyRate,
    bookingVelocity,
    listingSignals: listingSignals ?? undefined,
  });

  const autopilotComposite = listingSignals
    ? computeCompositeScore({ domain: "autopilot", listing: listingSignals, userSignals: null })
    : null;

  if (listingSignals && autopilotComposite) {
    await writeListingIntelligenceSnapshot({
      listingId,
      signals: listingSignals,
      composite: autopilotComposite,
      suggestedPrice: price.suggestedPrice,
      priceDeltaPct: price.deltaPct,
      domainSummary: price.compositeExplanation ?? price.reasonSummary,
    });
    void logIntelligenceDecision({
      domain: AiDecisionDomain.AUTOPILOT,
      actionType: "evaluate_listing",
      listingId,
      hostId: hostId,
      explanation: autopilotComposite.explanation,
      confidenceScore: autopilotComposite.confidenceScore,
      inputPayload: { demandScore: demand.demandScore },
      outputPayload: {
        suggestedPrice: price.suggestedPrice,
        intelligence: autopilotComposite.scores,
      },
    });
  }

  const snapshot = await prisma.listingPricingSnapshot.create({
    data: {
      listingId,
      basePrice: currentNightly,
      suggestedPrice: price.suggestedPrice,
      occupancyRate,
      bookingVelocity,
      viewsCount: views30,
      demandScore: demand.demandScore,
      seasonalityScore: demand.seasonalityScore,
      competitionScore: demand.competitionScore,
      reasonSummary: price.reasonSummary,
      confidenceScore: price.confidenceScore,
    },
  });

  let suggestionsCreated = 0;
  let actionsCreated = 0;

  const suggestDelta = price.suggestedPrice - price.currentPrice;
  const sixHoursAgo = new Date(Date.now() - 6 * 3600000);
  const recentPriceSuggestion = await prisma.aiSuggestion.findFirst({
    where: {
      listingId,
      type: { in: [AiSuggestionType.PRICE_INCREASE, AiSuggestionType.PRICE_DECREASE] },
      createdAt: { gte: sixHoursAgo },
    },
  });

  if (Math.abs(suggestDelta) > 0.5 && !recentPriceSuggestion) {
    const type =
      suggestDelta > 0 ? AiSuggestionType.PRICE_INCREASE : AiSuggestionType.PRICE_DECREASE;
    await createAiSuggestionRow({
      listingId,
      hostId,
      type,
      title: suggestDelta > 0 ? "Suggested by AI: increase nightly rate" : "Suggested by AI: adjust nightly rate",
      description: `Reason: ${price.reasonSummary} · Confidence: ${(price.confidenceScore * 100).toFixed(0)}%.`,
      payload: {
        current: price.currentPrice,
        suggested: price.suggestedPrice,
        nightPriceCents: Math.round(price.suggestedPrice * 100),
        deltaPct: price.deltaPct,
      },
      confidenceScore: price.confidenceScore,
    });
    suggestionsCreated += 1;
  }

  const photoCount = listing.listingPhotos.length;
  if (photoCount < 5) {
    await createAiSuggestionRow({
      listingId,
      hostId,
      type: AiSuggestionType.PHOTO_QUALITY_WARNING,
      title: "Add photos to improve conversions",
      description: `Listings with more photos tend to book faster. You have ${photoCount} approved photos — aim for 8+.`,
      confidenceScore: 0.75,
    });
    suggestionsCreated += 1;
  }

  const descLen = listing.description?.trim().length ?? 0;
  if (descLen < 120) {
    await createAiSuggestionRow({
      listingId,
      hostId,
      type: AiSuggestionType.DESCRIPTION_IMPROVEMENT,
      title: "Description is too short",
      description: "Guests trust listings with clear, detailed descriptions of space and amenities.",
      confidenceScore: 0.7,
    });
    suggestionsCreated += 1;
  }

  const titleLen = listing.title.trim().length;
  if (titleLen < 24) {
    await createAiSuggestionRow({
      listingId,
      hostId,
      type: AiSuggestionType.TITLE_IMPROVEMENT,
      title: "Strengthen your listing title",
      description: "Use location + property type + one standout feature in the title.",
      confidenceScore: 0.65,
    });
    suggestionsCreated += 1;
  }

  const amenities = listing.amenities;
  const amenCount = Array.isArray(amenities) ? amenities.length : 0;
  if (amenCount < 5) {
    await createAiSuggestionRow({
      listingId,
      hostId,
      type: AiSuggestionType.AMENITIES_IMPROVEMENT,
      title: "Add more amenity tags",
      description: "Completing amenities helps match you with the right guests.",
      confidenceScore: 0.6,
    });
    suggestionsCreated += 1;
  }

  const canAutoPrice =
    settings.autoPricing &&
    !settings.requireApprovalForPricing &&
    settings.mode !== AutopilotMode.ASSIST &&
    Math.abs(price.deltaPct) > 1;

  if (canAutoPrice && Math.abs(suggestDelta) > 0.5) {
    await prisma.aiAutopilotAction.create({
      data: {
        listingId,
        hostId,
        actionType: AiAutopilotActionType.UPDATE_PRICE,
        status:
          settings.mode === AutopilotMode.FULL_AUTOPILOT_APPROVAL
            ? AiAutopilotActionStatus.PENDING
            : AiAutopilotActionStatus.APPROVED,
        inputPayload: { nightPriceCents: Math.round(price.suggestedPrice * 100) } as object,
        reasonSummary: price.reasonSummary,
      },
    });
    actionsCreated += 1;
  } else if (
    settings.autoPricing &&
    settings.requireApprovalForPricing &&
    Math.abs(suggestDelta) > 0.5 &&
    settings.mode !== AutopilotMode.ASSIST
  ) {
    await prisma.aiAutopilotAction.create({
      data: {
        listingId,
        hostId,
        actionType: AiAutopilotActionType.UPDATE_PRICE,
        status: AiAutopilotActionStatus.PENDING,
        inputPayload: { nightPriceCents: Math.round(price.suggestedPrice * 100) } as object,
        reasonSummary: "Approval required before price change",
      },
    });
    actionsCreated += 1;
  }

  return {
    listingId,
    snapshotId: snapshot.id,
    suggestionsCreated,
    actionsCreated,
  };
}
