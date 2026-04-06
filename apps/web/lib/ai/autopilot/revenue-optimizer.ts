import { prisma } from "@/lib/db";
import { logManagerAction } from "@/lib/ai/logger";
import { gateAutopilotRecommendation } from "@/lib/ai/autopilot/autopilot-gate";
import { reserveAutopilotTemplate } from "@/lib/ai/learning/template-performance";
import { notifyHostAutopilot } from "@/lib/ai/autopilot/notify-host";
import type { HostAutopilotConfig } from "@/lib/ai/autopilot/host-config";
import type { ListingStatus } from "@prisma/client";
import { translateServer } from "@/lib/i18n/server-translate";
import type { LocaleCode } from "@/lib/i18n/locales";
import { getUserUiLocaleCode } from "@/lib/i18n/user-ui-locale";
import { shouldSuppressAggressiveAutopilotForListing } from "@/lib/ai/fraud/fraud-engine";

/** Tunable thresholds — exported for tests. */
export const REVENUE_RULE_THRESHOLDS = {
  /** Bookings in last 30d at or below this count = low activity (published listings). */
  lowBooking30d: 1,
  /** At or above = strong activity; suppress discount / promotion suggestions. */
  strongBooking30d: 3,
  /** Few bookings in 90d triggers pricing review consideration. */
  lowBooking90dForPricingReview: 2,
  /** Days without a booking (or since publish if never booked) for stale copy path. */
  staleDays: 60,
  /** Below this `BnhubPropertyClassification.overallScore` = weak quality signal. */
  weakClassificationScore: 55,
  minPhotosForHeuristic: 3,
  minDescriptionChars: 120,
} as const;

export type RevenueRecommendationType =
  | "promotion_suggestion"
  | "pricing_review"
  | "copy_refresh"
  | "listing_quality_fix";

export type RevenueRecommendation = {
  type: RevenueRecommendationType;
  listingId: string;
  title: string;
  summary: string;
  recommendedAction: string;
  confidence: number;
  priority: number;
  reasons: string[];
  ruleName: string;
  metricSnapshot: Record<string, unknown>;
};

const BOOKING_STATUSES_FOR_ACTIVITY = [
  "CONFIRMED",
  "COMPLETED",
  "PENDING",
  "AWAITING_HOST_APPROVAL",
] as const;

function photosFromJson(photos: unknown): string[] {
  if (!Array.isArray(photos)) return [];
  return photos.filter((x): x is string => typeof x === "string");
}

export type ListingRevenueMetrics = {
  listingId: string;
  title: string;
  published: boolean;
  bookingCountLast30d: number;
  bookingCountLast90d: number;
  nightsBookedLast30d: number;
  /** Approximate share of last 30 nights booked (single unit); null if not published. */
  occupancyEstimate: number | null;
  averageBookingValueCents: number | null;
  staleDaysSinceLastBooking: number | null;
  /** For stale rules when there was never a booking: days since listing creation. */
  daysSinceListingCreated: number;
  activePromotionExists: boolean;
  leadCountLast30d: number;
  overallClassificationScore: number | null;
  photoCount: number;
  descriptionLength: number;
  nightPriceCents: number;
};

function isPublished(status: ListingStatus): boolean {
  return status === "PUBLISHED";
}

function computeWeakQuality(m: ListingRevenueMetrics): boolean {
  if (m.overallClassificationScore != null) {
    return m.overallClassificationScore < REVENUE_RULE_THRESHOLDS.weakClassificationScore;
  }
  return (
    m.photoCount < REVENUE_RULE_THRESHOLDS.minPhotosForHeuristic ||
    m.descriptionLength < REVENUE_RULE_THRESHOLDS.minDescriptionChars
  );
}

/** Effective stale days: last booking age, or days since listing created if never booked. */
function staleDaysForListing(m: ListingRevenueMetrics): number {
  if (m.staleDaysSinceLastBooking != null) return m.staleDaysSinceLastBooking;
  return m.daysSinceListingCreated;
}

/**
 * Pure rule engine — used by the scan and by unit tests (no DB).
 * Does not apply the decision gate; callers surface results after gating.
 */
export function buildRevenueRecommendationsFromMetrics(
  m: ListingRevenueMetrics,
  locale: LocaleCode = "en",
): RevenueRecommendation[] {
  if (!m.published) return [];

  const tp = (key: string, vars?: Record<string, string | number>) => translateServer(locale, key, vars);

  const strong = m.bookingCountLast30d >= REVENUE_RULE_THRESHOLDS.strongBooking30d;
  const lowActivity = m.bookingCountLast30d <= REVENUE_RULE_THRESHOLDS.lowBooking30d;
  const weakQuality = computeWeakQuality(m);
  const staleDays = staleDaysForListing(m);
  const staleLong = staleDays >= REVENUE_RULE_THRESHOLDS.staleDays;

  const metricSnapshot: Record<string, unknown> = {
    bookingCountLast30d: m.bookingCountLast30d,
    bookingCountLast90d: m.bookingCountLast90d,
    nightsBookedLast30d: m.nightsBookedLast30d,
    occupancyEstimate: m.occupancyEstimate,
    averageBookingValueCents: m.averageBookingValueCents,
    staleDaysSinceLastBooking: m.staleDaysSinceLastBooking,
    daysSinceListingCreated: m.daysSinceListingCreated,
    staleDaysUsed: staleDays,
    activePromotionExists: m.activePromotionExists,
    leadCountLast30d: m.leadCountLast30d,
    overallClassificationScore: m.overallClassificationScore,
    photoCount: m.photoCount,
    descriptionLength: m.descriptionLength,
    nightPriceCents: m.nightPriceCents,
  };

  const out: RevenueRecommendation[] = [];

  // Rule 5: weak quality + low activity → listing quality / copy before promotion
  if (weakQuality && lowActivity) {
    out.push({
      type: "listing_quality_fix",
      listingId: m.listingId,
      title: tp("autopilot.revenue.listingQualityTitle"),
      summary: tp("autopilot.revenue.listingQualitySummary"),
      recommendedAction: tp("autopilot.revenue.listingQualityAction"),
      confidence: 0.62,
      priority: 1,
      reasons: [
        "weak_quality_signal",
        "low_recent_bookings",
        "prioritize_listing_quality_before_promotion",
      ],
      ruleName: "host_autopilot_revenue_listing_quality_fix",
      metricSnapshot: { ...metricSnapshot },
    });
  }

  // Rule 2: long stale period → copy refresh (when not strong; skip if we already prioritized quality fix for weak+low)
  if (!strong && staleLong && !(weakQuality && lowActivity)) {
    out.push({
      type: "copy_refresh",
      listingId: m.listingId,
      title: tp("autopilot.revenue.copyRefreshTitle"),
      summary: tp("autopilot.revenue.copyRefreshSummary"),
      recommendedAction: tp("autopilot.revenue.copyRefreshAction"),
      confidence: 0.58,
      priority: 2,
      reasons: ["stale_booking_or_listing_age", "copy_may_improve_conversion"],
      ruleName: "host_autopilot_revenue_copy_refresh",
      metricSnapshot: { ...metricSnapshot },
    });
  }

  // Rules 1, 3, 4: low booking activity → promotion; strong activity or active promo → no promotion
  if (
    lowActivity &&
    !strong &&
    !m.activePromotionExists &&
    !(weakQuality && lowActivity)
  ) {
    out.push({
      type: "promotion_suggestion",
      listingId: m.listingId,
      title: tp("autopilot.revenue.promotionTitle"),
      summary: tp("autopilot.revenue.promotionSummary"),
      recommendedAction: tp("autopilot.revenue.promotionAction"),
      confidence: 0.54,
      priority: 3,
      reasons: ["low_booking_activity_last_30d", "no_overlapping_promotion", "not_strong_activity"],
      ruleName: "host_autopilot_revenue_promotion",
      metricSnapshot: { ...metricSnapshot },
    });
  }

  // Stale + weak + low: also suggest copy refresh alongside quality fix (rule 2 nuance)
  if (!strong && staleLong && weakQuality && lowActivity) {
    out.push({
      type: "copy_refresh",
      listingId: m.listingId,
      title: tp("autopilot.revenue.copyRefreshTitle"),
      summary: tp("autopilot.revenue.copyRefreshSummaryAlt"),
      recommendedAction: tp("autopilot.revenue.copyRefreshActionAlt"),
      confidence: 0.56,
      priority: 2,
      reasons: ["stale_booking_or_listing_age", "paired_with_quality_improvement"],
      ruleName: "host_autopilot_revenue_copy_refresh",
      metricSnapshot: { ...metricSnapshot },
    });
  }

  // Pricing review: suggestion-only path; suppressed when performing strongly
  if (!strong && m.bookingCountLast90d <= REVENUE_RULE_THRESHOLDS.lowBooking90dForPricingReview) {
    out.push({
      type: "pricing_review",
      listingId: m.listingId,
      title: tp("autopilot.revenue.pricingReviewTitle"),
      summary: tp("autopilot.revenue.pricingReviewSummary", {
        rate: (m.nightPriceCents / 100).toFixed(0),
      }),
      recommendedAction: tp("autopilot.revenue.pricingReviewAction"),
      confidence: 0.52,
      priority: 4,
      reasons: ["low_booking_volume_90d", "pricing_review_suggestion_only"],
      ruleName: "host_autopilot_revenue_pricing_review",
      metricSnapshot: { ...metricSnapshot },
    });
  }

  out.sort((a, b) => a.priority - b.priority);
  return out;
}

/** Whether a surfaced item would use an approval queue (promotion + full mode only). */
export function revenueRecommendationUsesApprovalRequest(
  type: RevenueRecommendationType,
  cfg: Pick<HostAutopilotConfig, "autopilotMode" | "preferences">,
): boolean {
  if (type !== "promotion_suggestion") return false;
  return cfg.autopilotMode === "FULL_AUTOPILOT_APPROVAL" && cfg.preferences.autoPromotions;
}

async function recentRevenueOptimizerDuplicate(
  hostId: string,
  listingId: string,
  ruleName: string,
  hours = 24,
): Promise<boolean> {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  const hit = await prisma.managerAiRecommendation.findFirst({
    where: {
      userId: hostId,
      targetEntityType: "short_term_listing",
      targetEntityId: listingId,
      status: "active",
      createdAt: { gte: since },
      payload: {
        path: ["revenueOptimizerRule"],
        equals: ruleName,
      },
    },
    select: { id: true },
  });
  return Boolean(hit);
}

async function recentApprovalDuplicate(
  hostId: string,
  listingId: string,
  actionKey: string,
  hours = 24,
): Promise<boolean> {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  const hit = await prisma.managerAiApprovalRequest.findFirst({
    where: {
      requesterId: hostId,
      targetEntityType: "short_term_listing",
      targetEntityId: listingId,
      actionKey,
      status: "pending",
      createdAt: { gte: since },
    },
    select: { id: true },
  });
  return Boolean(hit);
}

export async function computeListingRevenueMetrics(
  row: {
    id: string;
    title: string;
    listingStatus: ListingStatus;
    description: string | null;
    photos: unknown;
    nightPriceCents: number;
    createdAt: Date;
    _count?: { listingPhotos: number };
  },
  bookingRows: { listingId: string; createdAt: Date; nights: number; totalCents: number }[],
  activePromotionListingIds: Set<string>,
  classificationScoreByListing: Map<string, number>,
  leadCountByListing: Map<string, number>,
): Promise<ListingRevenueMetrics> {
  const now = Date.now();
  const cutoff30 = now - 30 * 24 * 60 * 60 * 1000;
  const cutoff90 = now - 90 * 24 * 60 * 60 * 1000;

  const mine = bookingRows.filter((b) => b.listingId === row.id);
  const b30 = mine.filter((b) => b.createdAt.getTime() >= cutoff30);
  const b90 = mine.filter((b) => b.createdAt.getTime() >= cutoff90);

  const bookingCountLast30d = b30.length;
  const bookingCountLast90d = b90.length;
  const nightsBookedLast30d = b30.reduce((s, b) => s + b.nights, 0);
  const published = isPublished(row.listingStatus);
  const occupancyEstimate = published ? Math.min(1, nightsBookedLast30d / 30) : null;

  const avgCents =
    b90.length > 0 ? Math.round(b90.reduce((s, b) => s + b.totalCents, 0) / b90.length) : null;

  const lastBook = mine.length
    ? mine.reduce((a, b) => (a.createdAt > b.createdAt ? a : b))
    : null;
  const staleDaysSinceLastBooking = lastBook
    ? Math.floor((now - lastBook.createdAt.getTime()) / (24 * 60 * 60 * 1000))
    : null;

  const jsonPhotos = photosFromJson(row.photos);
  const photoCount = Math.max(jsonPhotos.length, row._count?.listingPhotos ?? 0);

  return {
    listingId: row.id,
    title: row.title,
    published,
    bookingCountLast30d,
    bookingCountLast90d,
    nightsBookedLast30d,
    occupancyEstimate,
    averageBookingValueCents: avgCents,
    staleDaysSinceLastBooking,
    daysSinceListingCreated: Math.floor((now - row.createdAt.getTime()) / (24 * 60 * 60 * 1000)),
    activePromotionExists: activePromotionListingIds.has(row.id),
    leadCountLast30d: leadCountByListing.get(row.id) ?? 0,
    overallClassificationScore: classificationScoreByListing.get(row.id) ?? null,
    photoCount,
    descriptionLength: (row.description ?? "").trim().length,
    nightPriceCents: row.nightPriceCents,
  };
}

async function surfaceOneRecommendation(
  hostId: string,
  cfg: HostAutopilotConfig,
  rec: RevenueRecommendation,
  hostLocale: LocaleCode,
): Promise<void> {
  const logExtras = {
    revenueOptimizer: true,
    ruleName: rec.ruleName,
    listingId: rec.listingId,
    metricSnapshot: rec.metricSnapshot,
    revenueOptimizerType: rec.type,
  };

  const gate = await gateAutopilotRecommendation({
    ruleName: rec.ruleName,
    hostId,
    listingId: rec.listingId,
    baseConfidence: rec.confidence,
    logActionKey: rec.ruleName,
    targetEntityType: "short_term_listing",
    targetEntityId: rec.listingId,
    logPayloadExtra: logExtras,
  });

  if (!gate.ok) {
    /* Suppression already logged by gateAutopilotRecommendation with metricSnapshot. */
    return;
  }

  const tpl = await reserveAutopilotTemplate(rec.ruleName, hostId);
  const payloadBase = {
    autopilot: true,
    revenueOptimizer: true,
    revenueOptimizerType: rec.type,
    revenueOptimizerRule: rec.ruleName,
    autopilotTemplateKey: tpl,
    metricSnapshot: rec.metricSnapshot,
    reasons: rec.reasons,
  } as Record<string, unknown>;

  const suggestedActionJson = JSON.stringify({
    type: rec.type,
    listingId: rec.listingId,
    recommendedAction: rec.recommendedAction,
    priority: rec.priority,
  });

  const useApproval =
    rec.type === "promotion_suggestion" && revenueRecommendationUsesApprovalRequest(rec.type, cfg);

  if (useApproval) {
    if (await recentApprovalDuplicate(hostId, rec.listingId, rec.ruleName)) return;
    await prisma.managerAiApprovalRequest.create({
      data: {
        requesterId: hostId,
        actionKey: rec.ruleName,
        targetEntityType: "short_term_listing",
        targetEntityId: rec.listingId,
        status: "pending",
        confidence: gate.confidence,
        payload: {
          kind: "revenue_optimizer_promotion",
          summary: rec.summary,
          title: rec.title,
          ...payloadBase,
        } as object,
      },
    });
    await logManagerAction({
      userId: hostId,
      actionKey: rec.ruleName,
      targetEntityType: "short_term_listing",
      targetEntityId: rec.listingId,
      status: "pending_approval",
      decisionScore: gate.decisionScore,
      payload: {
        ...logExtras,
        decisionScore: gate.decisionScore,
        decisionReasons: gate.reasons,
        decisionBand: gate.band,
        decisionEngine: "multi_factor",
        mode: "FULL_AUTOPILOT_APPROVAL",
      },
    });
    await notifyHostAutopilot({
      userId: hostId,
      locale: hostLocale,
      title: translateServer(hostLocale, "autopilot.revenuePromotionApprovalNotifyTitle"),
      message: rec.title,
      metadata: { listingId: rec.listingId, revenueOptimizerType: rec.type },
    });
    return;
  }

  if (await recentRevenueOptimizerDuplicate(hostId, rec.listingId, rec.ruleName)) return;

  await prisma.managerAiRecommendation.create({
    data: {
      userId: hostId,
      agentKey: "revenue",
      title: rec.title,
      description: rec.summary,
      targetEntityType: "short_term_listing",
      targetEntityId: rec.listingId,
      suggestedAction: suggestedActionJson,
      confidence: gate.confidence,
      payload: payloadBase as object,
    },
  });

  await logManagerAction({
    userId: hostId,
    actionKey: rec.ruleName,
    targetEntityType: "short_term_listing",
    targetEntityId: rec.listingId,
    status: "suggested",
    decisionScore: gate.decisionScore,
    payload: {
      ...logExtras,
      decisionScore: gate.decisionScore,
      decisionReasons: gate.reasons,
      decisionBand: gate.band,
      decisionEngine: "multi_factor",
    },
  });
}

/**
 * Scheduled-scan hook: loads real booking, promotion, classification, and lead data,
 * builds ranked recommendations, runs each through the decision engine, and persists
 * suggestions or promotion approval requests. Never applies live pricing.
 */
export async function runRevenueOptimizerScan(hostId: string, cfg: HostAutopilotConfig): Promise<void> {
  if (cfg.autopilotMode === "OFF" || !cfg.autopilotEnabled) return;

  const hostLocale = await getUserUiLocaleCode(hostId);

  const listings = await prisma.shortTermListing.findMany({
    where: { ownerId: hostId },
    select: {
      id: true,
      title: true,
      listingStatus: true,
      description: true,
      photos: true,
      nightPriceCents: true,
      createdAt: true,
      _count: { select: { listingPhotos: true } },
    },
    take: 25,
  });
  if (!listings.length) return;

  const listingIds = listings.map((l) => l.id);
  const cutoff90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const cutoff30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const bookingRows = await prisma.booking.findMany({
    where: {
      listingId: { in: listingIds },
      status: { in: [...BOOKING_STATUSES_FOR_ACTIVITY] },
      createdAt: { gte: cutoff90 },
    },
    select: { listingId: true, createdAt: true, nights: true, totalCents: true },
  });

  const promotions = await prisma.bnhubHostListingPromotion.findMany({
    where: {
      listingId: { in: listingIds },
      active: true,
      startDate: { lte: today },
      endDate: { gte: today },
    },
    select: { listingId: true },
  });
  const activePromotionListingIds = new Set(promotions.map((p) => p.listingId));

  const classifications = await prisma.bnhubPropertyClassification.findMany({
    where: { listingId: { in: listingIds } },
    select: { listingId: true, overallScore: true },
  });
  const classificationScoreByListing = new Map(classifications.map((c) => [c.listingId, c.overallScore]));

  const leads = await prisma.bnhubLead.groupBy({
    by: ["listingId"],
    where: {
      listingId: { in: listingIds },
      createdAt: { gte: cutoff30 },
    },
    _count: true,
  });
  const leadCountByListing = new Map(
    leads.filter((g) => g.listingId != null).map((g) => [g.listingId as string, g._count]),
  );

  for (const row of listings) {
    if (await shouldSuppressAggressiveAutopilotForListing(row.id)) continue;
    const metrics = await computeListingRevenueMetrics(
      row,
      bookingRows,
      activePromotionListingIds,
      classificationScoreByListing,
      leadCountByListing,
    );
    const recs = buildRevenueRecommendationsFromMetrics(metrics, hostLocale);
    const seenRule = new Set<string>();
    for (const rec of recs) {
      if (rec.type === "promotion_suggestion" && !cfg.preferences.autoPromotions) continue;
      if (seenRule.has(rec.ruleName)) continue;
      seenRule.add(rec.ruleName);
      await surfaceOneRecommendation(hostId, cfg, rec, hostLocale);
    }
  }
}
