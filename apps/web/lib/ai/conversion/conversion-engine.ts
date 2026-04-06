import type { PrismaClient } from "@prisma/client";
import { gateAutopilotRecommendation } from "@/lib/ai/autopilot/autopilot-gate";
import type {
  AggregatedConversionCounts,
} from "./conversion-signals";
import { loadAggregatedConversionCounts } from "./conversion-signals";
import type {
  ConversionRecommendation,
  ConversionRecommendationPriority,
  ListingConversionInsight,
  ListingConversionMetrics,
} from "./conversion-types";

/** Minimum listing views before we interpret conversion rate (reduces noise). */
export const MIN_VIEWS_FOR_CONFIDENCE = 12;
/** "High traffic" for low-conversion flag (real impressions only). */
export const HIGH_VIEWS_THRESHOLD = 28;
/** Below this completed/view ratio with enough traffic → low conversion. */
export const LOW_CONVERSION_RATE_THRESHOLD = 0.035;
/** Small additive boost to learning `contextMatchBoost` (capped in DB write). */
export const TRUST_CONTEXT_BOOST_DELTA = 0.012;
export const TRUST_CONTEXT_BOOST_CAP = 0.052;

export type ListingContentSnapshot = {
  id: string;
  title: string;
  description: string | null;
  /** Count of `BnhubListingPhoto` rows + len(legacy photos JSON) — caller supplies total. */
  photoCount: number;
  nightPriceCents: number;
  houseRules: string | null;
  checkInInstructions: string | null;
  instantBookEnabled: boolean;
  bnhubListingRatingAverage: number | null;
  bnhubListingReviewCount: number;
  bnhubListingCompletedStays: number;
};

function safeDiv(n: number, d: number): number {
  if (!Number.isFinite(n) || !Number.isFinite(d) || d <= 0) return 0;
  return n / d;
}

/**
 * Merges aggregated DB counts + optional explicit AI conversion signals into funnel metrics.
 */
export function computeListingConversionMetrics(
  listingId: string,
  raw: AggregatedConversionCounts,
): ListingConversionMetrics {
  const ai = raw.aiSignalsByType;

  const listingViews =
    raw.searchViews +
    raw.behaviorImpressions +
    (ai.listing_view ?? 0);

  const listingClicks =
    raw.searchClicks +
    raw.behaviorClicks +
    (ai.listing_click ?? 0);

  const bookingStarts =
    raw.bookingAttempts +
    (ai.booking_started ?? 0);

  /** Bookings table is source of truth; explicit signals supplement only when DB rows lag. */
  const bookingsCompleted = Math.max(
    raw.bookingsCompleted,
    ai.booking_completed ?? 0,
  );

  const bookingsAbandoned =
    raw.bookingsAbandoned +
    (ai.booking_abandoned ?? 0);

  const messagesToHost =
    raw.messagesFromGuests +
    (ai.message_sent_to_host ?? 0);

  const hostMessageResponses =
    raw.messagesFromHost +
    (ai.message_response_received ?? 0);

  const sufficientData = listingViews >= MIN_VIEWS_FOR_CONFIDENCE;

  const conversionRate = sufficientData
    ? safeDiv(bookingsCompleted, listingViews)
    : null;

  const bookingStartRate = sufficientData
    ? safeDiv(bookingStarts, listingViews)
    : null;

  const abandonmentRate =
    bookingStarts > 0 ? safeDiv(bookingsAbandoned, bookingStarts) : bookingStarts === 0 && bookingsAbandoned > 0
      ? 1
      : null;

  const highTraffic = listingViews >= HIGH_VIEWS_THRESHOLD;
  const weakCompletionRate =
    conversionRate !== null && conversionRate <= LOW_CONVERSION_RATE_THRESHOLD;

  const lowConversion =
    sufficientData &&
    highTraffic &&
    (bookingsCompleted === 0 || weakCompletionRate);

  const explanation = sufficientData
    ? lowConversion
      ? `In the selected window this listing had ${listingViews} measured views and ${bookingsCompleted} completed booking${
          bookingsCompleted === 1 ? "" : "s"
        }. The completion rate is below typical for similar traffic, based only on platform events we recorded.`
      : `We have enough view data (${listingViews} views) to compare funnel steps. Completion rate is ${
          conversionRate === null ? "n/a" : (conversionRate * 100).toFixed(2)
        }% (completed stays ÷ views).`
    : `Not enough recorded views (${listingViews}) yet to compare conversion fairly — keep the listing published so we can learn from real traffic.`;

  return {
    listingId,
    listingViews,
    listingClicks,
    bookingStarts,
    bookingsCompleted,
    bookingsAbandoned,
    messagesToHost,
    hostMessageResponses,
    conversionRate,
    bookingStartRate,
    abandonmentRate,
    lowConversion,
    sufficientData,
    explanation,
  };
}

function priorityFor(kind: ConversionRecommendation["type"]): ConversionRecommendationPriority {
  switch (kind) {
    case "reduce_friction":
    case "photo_coverage":
      return "high";
    case "title_clarity":
    case "pricing_review":
      return "medium";
    default:
      return "low";
  }
}

/**
 * Honest, explainable suggestions — no scarcity, no fabricated demand.
 */
export function buildConversionOptimizationRecommendations(
  listing: ListingContentSnapshot,
  metrics: ListingConversionMetrics,
): ConversionRecommendation[] {
  if (!metrics.lowConversion) return [];

  const out: ConversionRecommendation[] = [];

  const titleWords = listing.title.trim().split(/\s+/).filter(Boolean).length;
  if (listing.title.trim().length < 14 || titleWords < 3) {
    out.push({
      type: "title_clarity",
      listingId: listing.id,
      summary: "Clarify the listing title with location and space type.",
      reasons: [
        `Title has ${titleWords} word(s); guests scan titles first in search results.`,
        "Use the real city or neighborhood and property type (no superlatives required).",
      ],
      priority: priorityFor("title_clarity"),
    });
  }

  const descLen = (listing.description ?? "").trim().length;
  if (descLen < 220) {
    out.push({
      type: "description_depth",
      listingId: listing.id,
      summary: "Expand the description with accurate details guests need to decide.",
      reasons: [
        `Description length is ${descLen} characters; thin copy correlates with higher drop-off when traffic is real.`,
        "Add check-in logistics, sleeping layout, and what makes the stay accurate — not marketing hype.",
      ],
      priority: priorityFor("description_depth"),
    });
  }

  if (listing.photoCount < 6) {
    out.push({
      type: "photo_coverage",
      listingId: listing.id,
      summary: "Add more photos of each main space.",
      reasons: [
        `We count ${listing.photoCount} photo(s); more angles reduce uncertainty without exaggerating the property.`,
        "Include bedrooms, bathroom, kitchen, and building access as applicable.",
      ],
      priority: priorityFor("photo_coverage"),
    });
  }

  out.push({
    type: "pricing_review",
    listingId: listing.id,
    summary: "Review nightly price and rules in the BNHub pricing tools.",
    reasons: [
      "Conversion is weak relative to measured views — price and minimum stay are common levers worth revisiting with real comps.",
      "Open BNHub listing editor → pricing to align with your calendar and the dynamic pricing suggestions there.",
    ],
    priority: priorityFor("pricing_review"),
  });

  const friction: string[] = [];
  if (!listing.houseRules?.trim()) friction.push("house rules");
  if (!listing.checkInInstructions?.trim()) friction.push("check-in instructions");
  if (!listing.instantBookEnabled) friction.push("instant book is off (guests wait for approval)");

  if (friction.length > 0) {
    out.push({
      type: "reduce_friction",
      listingId: listing.id,
      summary: "Reduce booking friction by filling missing guest-facing details.",
      reasons: [
        `Missing or heavier flows: ${friction.join(", ")}.`,
        "Guests abandon when required information is unclear — only add truthful details you can honor.",
      ],
      priority: priorityFor("reduce_friction"),
    });
  }

  out.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  });

  return out;
}

export function evaluateTrustSignalBoost(input: {
  listingAvgRating: number | null;
  listingReviewCount: number;
  completedStays: number;
  hostCompletionRate: number | null;
  hostScore: number | null;
}): { shouldBoost: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const reviewsOk =
    input.listingReviewCount >= 3 &&
    (input.listingAvgRating ?? 0) >= 4.0;

  if (reviewsOk) {
    reasons.push(
      `Listing has ${input.listingReviewCount} reviews with ${(input.listingAvgRating ?? 0).toFixed(2)} average (from real guest feedback).`,
    );
  }

  const perfOk =
    (input.hostCompletionRate === null || input.hostCompletionRate >= 0.82) &&
    (input.hostScore === null || input.hostScore >= 0.68);

  if (input.hostCompletionRate !== null) {
    reasons.push(`Host completion rate (platform metric): ${(input.hostCompletionRate * 100).toFixed(0)}%.`);
  }
  if (input.hostScore !== null) {
    reasons.push(`Host reliability score (platform metric): ${input.hostScore.toFixed(2)}.`);
  }

  const activityOk = input.completedStays >= 2;

  const shouldBoost = reviewsOk && perfOk && activityOk;
  return { shouldBoost, reasons };
}

/**
 * Bounded marketplace ranking boost via learning stats — transparent, small effect.
 */
export async function applyTrustRankingBoostIfEligible(
  db: PrismaClient,
  listingId: string,
  evalResult: { shouldBoost: boolean },
): Promise<{ applied: boolean; newBoost: number | null }> {
  if (!evalResult.shouldBoost) return { applied: false, newBoost: null };

  const existing = await db.listingLearningStats.findUnique({
    where: { listingId },
    select: { contextMatchBoost: true },
  });
  const current = existing?.contextMatchBoost ?? 0;
  /** One uplift per listing (avoid boosting on every dashboard refresh). */
  if (current >= TRUST_CONTEXT_BOOST_DELTA - 1e-9) {
    return { applied: false, newBoost: current };
  }
  if (current >= TRUST_CONTEXT_BOOST_CAP - 1e-6) {
    return { applied: false, newBoost: current };
  }

  const next = Math.min(TRUST_CONTEXT_BOOST_CAP, current + TRUST_CONTEXT_BOOST_DELTA);

  await db.listingLearningStats.upsert({
    where: { listingId },
    create: {
      listingId,
      behaviorScore: 0.5,
      contextMatchBoost: next,
      recentTrendScore: 0.5,
      finalLearningScore: 0.5,
      totalWeightedEvents: 0,
      impressionCount30d: 0,
      engagementCount30d: 0,
    },
    update: {
      contextMatchBoost: next,
    },
  });

  return { applied: true, newBoost: next };
}

export async function gateConversionRecommendationsForListing(input: {
  hostId: string;
  listingId: string;
  metrics: ListingConversionMetrics;
}): Promise<
  | { ok: true }
  | { ok: false; suppressionReason: string }
> {
  if (!input.metrics.lowConversion) return { ok: true };

  const gate = await gateAutopilotRecommendation({
    ruleName: "bnhub_conversion_insights",
    hostId: input.hostId,
    listingId: input.listingId,
    baseConfidence: 0.55,
    logActionKey: "bnhub_conversion_insights_gate",
    targetEntityType: "ShortTermListing",
    targetEntityId: input.listingId,
    logPayloadExtra: {
      listingViews: input.metrics.listingViews,
      bookingsCompleted: input.metrics.bookingsCompleted,
      conversionRate: input.metrics.conversionRate,
    },
  });

  if (!gate.ok) {
    return { ok: false, suppressionReason: gate.suppressionReason };
  }
  return { ok: true };
}

async function photoCountForListing(
  db: PrismaClient,
  listing: { id: string; photos: unknown },
): Promise<number> {
  const structured = await db.bnhubListingPhoto.count({ where: { listingId: listing.id } });
  let legacy = 0;
  if (Array.isArray(listing.photos)) legacy = listing.photos.length;
  return structured > 0 ? structured : legacy;
}

/**
 * Server entry: loads signals, metrics, recommendations, trust boost, and decision gating for host dashboard.
 */
export async function getHostConversionInsights(
  db: PrismaClient,
  hostId: string,
  options?: { windowDays?: number },
): Promise<ListingConversionInsight[]> {
  const windowDays = options?.windowDays ?? 30;
  const since = new Date();
  since.setDate(since.getDate() - windowDays);

  const listings = await db.shortTermListing.findMany({
    where: { ownerId: hostId },
    select: {
      id: true,
      title: true,
      description: true,
      photos: true,
      nightPriceCents: true,
      houseRules: true,
      checkInInstructions: true,
      instantBookEnabled: true,
      bnhubListingRatingAverage: true,
      bnhubListingReviewCount: true,
      bnhubListingCompletedStays: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  const hostPerf = await db.hostPerformance
    .findUnique({
      where: { hostId },
      select: { completionRate: true, score: true },
    })
    .catch(() => null);

  const results: ListingConversionInsight[] = [];

  for (const listing of listings) {
    const counts = await loadAggregatedConversionCounts(db, listing.id, hostId, since);
    const metrics = computeListingConversionMetrics(listing.id, counts);

    const snapshot: ListingContentSnapshot = {
      id: listing.id,
      title: listing.title,
      description: listing.description,
      photoCount: await photoCountForListing(db, listing),
      nightPriceCents: listing.nightPriceCents,
      houseRules: listing.houseRules,
      checkInInstructions: listing.checkInInstructions,
      instantBookEnabled: listing.instantBookEnabled,
      bnhubListingRatingAverage: listing.bnhubListingRatingAverage,
      bnhubListingReviewCount: listing.bnhubListingReviewCount,
      bnhubListingCompletedStays: listing.bnhubListingCompletedStays,
    };

    let recommendations = buildConversionOptimizationRecommendations(snapshot, metrics);

    const gate = await gateConversionRecommendationsForListing({
      hostId,
      listingId: listing.id,
      metrics,
    });

    let decisionSuppressed = false;
    let decisionSuppressionReason: string | null = null;
    if (!gate.ok) {
      recommendations = [];
      decisionSuppressed = true;
      decisionSuppressionReason = gate.suppressionReason;
    }

    const trustEval = evaluateTrustSignalBoost({
      listingAvgRating: listing.bnhubListingRatingAverage,
      listingReviewCount: listing.bnhubListingReviewCount,
      completedStays: listing.bnhubListingCompletedStays,
      hostCompletionRate: hostPerf?.completionRate ?? null,
      hostScore: hostPerf?.score ?? null,
    });

    let trustRankingBoostApplied = false;
    let trustRankingBoostNote: string | null = null;

    if (trustEval.shouldBoost) {
      const applied = await applyTrustRankingBoostIfEligible(db, listing.id, trustEval);
      if (applied.applied) {
        trustRankingBoostApplied = true;
        trustRankingBoostNote =
          "Applied a small ranking context boost from verified reviews and host reliability metrics (capped; explainable).";
        const trustRec: ConversionRecommendation = {
          type: "trust_signal_boost",
          listingId: listing.id,
          summary: "Trust signals support a modest discovery boost.",
          reasons: trustEval.reasons,
          priority: "low",
        };
        if (gate.ok || !metrics.lowConversion) {
          recommendations = [...recommendations, trustRec];
        }
      }
    }

    results.push({
      listingId: listing.id,
      title: listing.title,
      metrics,
      recommendations,
      trustRankingBoostApplied,
      trustRankingBoostNote,
      decisionSuppressed,
      decisionSuppressionReason,
    });
  }

  return results;
}
