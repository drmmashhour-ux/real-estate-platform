import { prisma } from "@/lib/db";
import { logManagerAction } from "@/lib/ai/logger";
import { gateAutopilotRecommendation } from "@/lib/ai/autopilot/autopilot-gate";
import { reserveAutopilotTemplate } from "@/lib/ai/learning/template-performance";
import { notifyHostAutopilot } from "@/lib/ai/autopilot/notify-host";
import { getCalibratedConfidence } from "@/lib/ai/learning/confidence-calibration";
import type { HostAutopilotConfig } from "@/lib/ai/autopilot/host-config";
import { pricingDecision } from "@/lib/ai/autopilot/host-config";
import { translateServer } from "@/lib/i18n/server-translate";
import { getUserUiLocaleCode } from "@/lib/i18n/user-ui-locale";
import type { LocaleCode } from "@/lib/i18n/locales";
import type {
  DynamicPricingEvaluation,
  DynamicPricingRecommendation,
  RecommendedPriceRange,
} from "./pricing-types";
import { DYNAMIC_PRICING_LIVE_APPLY_DEFAULT } from "./pricing-types";
import { loadBnhubPricingSignals, type BnhubPricingSignals } from "./pricing-signals";
import { shouldSuppressAggressiveAutopilotForListing } from "@/lib/ai/fraud/fraud-engine";

export { DYNAMIC_PRICING_LIVE_APPLY_DEFAULT };

/** Tunable thresholds — deterministic; exported for tests. */
export const DYNAMIC_PRICING_RULE_THRESHOLDS = {
  lowBooking30d: 1,
  strongBooking30d: 3,
  lowOccupancy: 0.22,
  strongOccupancy: 0.4,
  longAvailableStreakDays: 14,
  tightCalendarStreakDays: 7,
  lowBooking90dForSoftDemand: 2,
  weakQualityScore: 55,
  minPhotos: 3,
  minDescriptionChars: 120,
  /** Repeated rejected pricing approvals — suppress surfacing. */
  maxRejectedSimilarBeforeSuppress: 3,
} as const;

function isWeakListingQuality(s: BnhubPricingSignals): boolean {
  if (s.listingQualityScore != null) {
    return s.listingQualityScore < DYNAMIC_PRICING_RULE_THRESHOLDS.weakQualityScore;
  }
  return (
    s.photoCount < DYNAMIC_PRICING_RULE_THRESHOLDS.minPhotos ||
    s.descriptionLength < DYNAMIC_PRICING_RULE_THRESHOLDS.minDescriptionChars
  );
}

function priceRangeFromMultipliers(
  cents: number,
  currency: string,
  minMul: number,
  maxMul: number,
): RecommendedPriceRange {
  const cur = cents / 100;
  return {
    min: Math.round(cur * minMul * 100) / 100,
    max: Math.round(cur * maxMul * 100) / 100,
    currency,
  };
}

function metricsSnapshotBase(s: BnhubPricingSignals): Record<string, unknown> {
  return {
    recentBookingCount30d: s.recentBookingCount30d,
    recentBookingCount90d: s.recentBookingCount90d,
    daysSinceLastBooking: s.daysSinceLastBooking,
    occupancyEstimate: s.occupancyEstimate,
    activePromotionExists: s.activePromotionExists,
    upcomingAvailabilityGapDays: s.upcomingAvailabilityGapDays,
    recentViews7d: s.recentViews7d,
    recentViews30d: s.recentViews30d,
    inquiryCount30d: s.inquiryCount30d,
    seasonalityProxyFromBookings: s.seasonalityProxyFromBookings,
    listingQualityScore: s.listingQualityScore,
    photoCount: s.photoCount,
    descriptionLength: s.descriptionLength,
    nightPriceCents: s.currentNightlyPriceCents,
  };
}

/**
 * Pure rule engine — no DB. Uses only fields present on `BnhubPricingSignals` (real data).
 */
export function evaluateDynamicPricingFromSignals(
  s: BnhubPricingSignals,
  ctx: { rejectedSimilarPricingAdviceCount: number },
): DynamicPricingEvaluation | null {
  if (!s.isPublished || s.currentNightlyPriceCents <= 0) return null;

  if (ctx.rejectedSimilarPricingAdviceCount >= DYNAMIC_PRICING_RULE_THRESHOLDS.maxRejectedSimilarBeforeSuppress) {
    return null;
  }

  const weak = isWeakListingQuality(s);

  const strongBookings = s.recentBookingCount30d >= DYNAMIC_PRICING_RULE_THRESHOLDS.strongBooking30d;
  const strongOcc =
    s.occupancyEstimate != null && s.occupancyEstimate >= DYNAMIC_PRICING_RULE_THRESHOLDS.strongOccupancy;
  const strongDemand = strongBookings || strongOcc;

  const tightCalendar =
    s.upcomingAvailabilityGapDays != null &&
    s.upcomingAvailabilityGapDays <= DYNAMIC_PRICING_RULE_THRESHOLDS.tightCalendarStreakDays;

  const softBookings = s.recentBookingCount30d <= DYNAMIC_PRICING_RULE_THRESHOLDS.lowBooking30d;
  const softOcc = s.occupancyEstimate == null || s.occupancyEstimate < DYNAMIC_PRICING_RULE_THRESHOLDS.lowOccupancy;
  const longIdleInventory =
    s.upcomingAvailabilityGapDays == null ||
    s.upcomingAvailabilityGapDays >= DYNAMIC_PRICING_RULE_THRESHOLDS.longAvailableStreakDays;
  const soft90 = s.recentBookingCount90d <= DYNAMIC_PRICING_RULE_THRESHOLDS.lowBooking90dForSoftDemand;

  const candidateIncrease = strongDemand && tightCalendar;
  const candidateDecrease =
    softBookings && softOcc && longIdleInventory && soft90 && !strongDemand;

  if (candidateIncrease) {
    const ruleName = "bnhub_dynamic_pricing_increase_review";
    const raw = 0.62;
    const rec: DynamicPricingRecommendation = {
      listingId: s.listingId,
      hostId: s.hostId,
      type: "price_increase_review",
      title: "",
      summary: "",
      recommendedPriceRange: priceRangeFromMultipliers(
        s.currentNightlyPriceCents,
        s.currency,
        1.03,
        1.08,
      ),
      confidence: raw,
      priority: "high",
      reasons: [
        "strong_recent_bookings_or_occupancy",
        "short_available_window_ahead",
        "suggestion_only_no_auto_apply",
      ],
      ruleName,
      metricsSnapshot: { ...metricsSnapshotBase(s), rule: "strong_demand_tight_calendar" },
    };
    return applyRejectionDampening(rec, raw, ctx.rejectedSimilarPricingAdviceCount);
  }

  if (candidateDecrease) {
    if (s.activePromotionExists) {
      return null;
    }
    if (weak) {
      const ruleName = "bnhub_dynamic_pricing_improve_listing_first";
      const raw = 0.64;
      const rec: DynamicPricingRecommendation = {
        listingId: s.listingId,
        hostId: s.hostId,
        type: "improve_listing_before_price_change",
        title: "",
        summary: "",
        recommendedPriceRange: priceRangeFromMultipliers(
          s.currentNightlyPriceCents,
          s.currency,
          0.92,
          0.97,
        ),
        confidence: raw,
        priority: "high",
        reasons: [
          "weak_listing_quality_signal",
          "soft_demand_signals",
          "improve_copy_and_photos_before_cutting_rate",
        ],
        ruleName,
        metricsSnapshot: { ...metricsSnapshotBase(s), rule: "weak_quality_soft_demand" },
      };
      return applyRejectionDampening(rec, raw, ctx.rejectedSimilarPricingAdviceCount);
    }

    const ruleName = "bnhub_dynamic_pricing_decrease_review";
    const raw = 0.58;
    const rec: DynamicPricingRecommendation = {
      listingId: s.listingId,
      hostId: s.hostId,
      type: "price_decrease_review",
      title: "",
      summary: "",
      recommendedPriceRange: priceRangeFromMultipliers(s.currentNightlyPriceCents, s.currency, 0.92, 0.97),
      confidence: raw,
      priority: ctx.rejectedSimilarPricingAdviceCount > 0 ? "low" : "medium",
      reasons: [
        "low_recent_bookings",
        "high_unsold_availability_or_soft_occupancy",
        "moderate_discount_review_only",
      ],
      ruleName,
      metricsSnapshot: { ...metricsSnapshotBase(s), rule: "low_demand_moderate_discount_review" },
    };
    return applyRejectionDampening(rec, raw, ctx.rejectedSimilarPricingAdviceCount);
  }

  return null;
}

function applyRejectionDampening(
  rec: DynamicPricingRecommendation,
  raw: number,
  rejections: number,
): DynamicPricingEvaluation {
  let confidence = raw;
  if (rejections > 0) {
    confidence = Math.max(0.2, raw - 0.12 * Math.min(rejections, 2));
    rec.priority = "low";
    rec.reasons = [...rec.reasons, "recent_similar_pricing_advice_rejected"];
  }
  return { recommendation: { ...rec, confidence }, rawConfidence: raw };
}

async function countRecentPricingRejections(hostId: string, listingId: string): Promise<number> {
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  return prisma.managerAiApprovalRequest.count({
    where: {
      requesterId: hostId,
      targetEntityType: "short_term_listing",
      targetEntityId: listingId,
      status: "rejected",
      updatedAt: { gte: since },
      actionKey: "host_autopilot_pricing_change",
    },
  });
}

async function recentDynamicPricingDuplicate(
  hostId: string,
  listingId: string,
  ruleName: string,
): Promise<boolean> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const hit = await prisma.managerAiRecommendation.findFirst({
    where: {
      userId: hostId,
      targetEntityType: "short_term_listing",
      targetEntityId: listingId,
      status: "active",
      createdAt: { gte: since },
      payload: {
        path: ["dynamicPricingRule"],
        equals: ruleName,
      },
    },
    select: { id: true },
  });
  return Boolean(hit);
}

function fillLocalizedCopy(
  rec: DynamicPricingRecommendation,
  locale: LocaleCode,
): DynamicPricingRecommendation {
  const min = rec.recommendedPriceRange?.min ?? 0;
  const max = rec.recommendedPriceRange?.max ?? 0;
  const cur = rec.metricsSnapshot.nightPriceCents
    ? Number(rec.metricsSnapshot.nightPriceCents) / 100
    : 0;

  if (rec.type === "price_increase_review") {
    return {
      ...rec,
      title: translateServer(locale, "autopilot.dynamicPricingIncreaseTitle"),
      summary: translateServer(locale, "autopilot.dynamicPricingIncreaseSummary", {
        minRate: min.toFixed(0),
        maxRate: max.toFixed(0),
        currentRate: cur.toFixed(0),
      }),
    };
  }
  if (rec.type === "price_decrease_review") {
    return {
      ...rec,
      title: translateServer(locale, "autopilot.dynamicPricingDecreaseTitle"),
      summary: translateServer(locale, "autopilot.dynamicPricingDecreaseSummary", {
        minRate: min.toFixed(0),
        maxRate: max.toFixed(0),
        currentRate: cur.toFixed(0),
      }),
    };
  }
  return {
    ...rec,
    title: translateServer(locale, "autopilot.dynamicPricingQualityFirstTitle"),
    summary: translateServer(locale, "autopilot.dynamicPricingQualityFirstSummary", {
      minRate: min.toFixed(0),
      maxRate: max.toFixed(0),
      currentRate: cur.toFixed(0),
    }),
  };
}

/**
 * Loads signals, evaluates rules, runs the decision gate, logs (including suppressions),
 * and creates a recommendation or approval request. Never updates live listing price.
 */
export async function runBnhubDynamicPricingForListing(
  hostId: string,
  cfg: HostAutopilotConfig,
  listingId: string,
): Promise<void> {
  void DYNAMIC_PRICING_LIVE_APPLY_DEFAULT;

  if (!cfg.preferences.autoPricing) return;
  const mode = pricingDecision(cfg.autopilotMode);
  if (mode === "none") return;

  const signals = await loadBnhubPricingSignals(prisma, listingId, hostId);
  if (!signals) return;
  if (await shouldSuppressAggressiveAutopilotForListing(listingId)) return;

  const rejections = await countRecentPricingRejections(hostId, listingId);
  const evaluated = evaluateDynamicPricingFromSignals(signals, {
    rejectedSimilarPricingAdviceCount: rejections,
  });
  if (!evaluated) return;

  const loc = await getUserUiLocaleCode(hostId);
  const rec = fillLocalizedCopy(evaluated.recommendation, loc);

  if (await recentDynamicPricingDuplicate(hostId, listingId, rec.ruleName)) return;

  const calibratedForLog = await getCalibratedConfidence(rec.ruleName, evaluated.rawConfidence);

  const gate = await gateAutopilotRecommendation({
    ruleName: rec.ruleName,
    hostId,
    listingId,
    baseConfidence: rec.confidence,
    logActionKey: rec.ruleName,
    targetEntityType: "short_term_listing",
    targetEntityId: listingId,
    logPayloadExtra: {
      bnhubDynamicPricing: true,
      listingId,
      hostId,
      ruleName: rec.ruleName,
      metricSnapshot: rec.metricsSnapshot,
      currentPriceCents: signals.currentNightlyPriceCents,
      recommendedPriceRange: rec.recommendedPriceRange,
      rawConfidence: evaluated.rawConfidence,
      calibratedConfidence: calibratedForLog,
    },
  });

  if (!gate.ok) return;

  await logManagerAction({
    userId: hostId,
    actionKey: rec.ruleName,
    targetEntityType: "short_term_listing",
    targetEntityId: listingId,
    status: "suggested",
    decisionScore: gate.decisionScore,
    confidence: evaluated.rawConfidence,
    payload: {
      bnhubDynamicPricing: true,
      listingId,
      hostId,
      ruleName: rec.ruleName,
      metricSnapshot: rec.metricsSnapshot,
      currentPriceCents: signals.currentNightlyPriceCents,
      recommendedPriceRange: rec.recommendedPriceRange,
      decisionScore: gate.decisionScore,
      rawConfidence: evaluated.rawConfidence,
      calibratedConfidence: gate.confidence,
      createdAt: new Date().toISOString(),
    },
  });

  const suggestedAction = JSON.stringify({
    kind: "bnhub_dynamic_pricing",
    type: rec.type,
    listingId: rec.listingId,
    recommendedPriceRange: rec.recommendedPriceRange,
    reasons: rec.reasons,
    priority: rec.priority,
    manualApplyOnly: true,
    disclaimer: "Suggestion only — change nightly price in the listing editor if you agree.",
  });

  const payloadBase = {
    bnhubDynamicPricing: true,
    dynamicPricingRule: rec.ruleName,
    metricsSnapshot: rec.metricsSnapshot,
    reasons: rec.reasons,
    priority: rec.priority,
    recommendedPriceRange: rec.recommendedPriceRange,
    rawConfidence: evaluated.rawConfidence,
    calibratedConfidence: gate.confidence,
    decisionScore: gate.decisionScore,
  } as Record<string, unknown>;

  if (mode === "approval") {
    const pricingApprovalTpl = await reserveAutopilotTemplate("host_autopilot_pricing_change", hostId);
    const pricingApprovalConf = await getCalibratedConfidence("host_autopilot_pricing_change", rec.confidence);
    await prisma.managerAiApprovalRequest.create({
      data: {
        requesterId: hostId,
        actionKey: "host_autopilot_pricing_change",
        targetEntityType: "short_term_listing",
        targetEntityId: listingId,
        status: "pending",
        confidence: pricingApprovalConf,
        payload: {
          kind: "bnhub_dynamic_pricing_suggestion",
          currentNightPriceCents: signals.currentNightlyPriceCents,
          recommendedPriceRange: rec.recommendedPriceRange,
          ruleName: rec.ruleName,
          disclaimer:
            "Approval records intent only — adjust nightly price manually in the listing editor. No automatic price change.",
          autopilotTemplateKey: pricingApprovalTpl,
          ...payloadBase,
        } as object,
      },
    });
    await notifyHostAutopilot({
      userId: hostId,
      locale: loc,
      title: translateServer(loc, "autopilot.pricingApprovalNotifyTitle"),
      message: translateServer(loc, "autopilot.pricingApprovalNotifyMessage"),
      metadata: { listingId, bnhubDynamicPricing: true },
    });
    return;
  }

  const tpl = await reserveAutopilotTemplate(rec.ruleName, hostId);
  await prisma.managerAiRecommendation.create({
    data: {
      userId: hostId,
      agentKey: "revenue",
      title: rec.title,
      description: rec.summary,
      targetEntityType: "short_term_listing",
      targetEntityId: listingId,
      suggestedAction,
      confidence: gate.confidence,
      payload: { ...payloadBase, autopilotTemplateKey: tpl } as object,
    },
  });

  const pricingListingTitle =
    signals.title.length > 40 ? `${signals.title.slice(0, 40)}…` : signals.title;
  await notifyHostAutopilot({
    userId: hostId,
    locale: loc,
    title: translateServer(loc, "autopilot.pricingNotifyTitle"),
    message: translateServer(loc, "autopilot.pricingNotifyMessage", { listingTitle: pricingListingTitle }),
    metadata: { listingId, bnhubDynamicPricing: true },
  });
}

/**
 * Scheduled host scan: evaluate dynamic pricing for published listings (bounded batch).
 */
export async function runBnhubDynamicPricingScheduledScan(
  hostId: string,
  cfg: HostAutopilotConfig,
): Promise<void> {
  if (!cfg.preferences.autoPricing) return;
  if (pricingDecision(cfg.autopilotMode) === "none") return;

  const listings = await prisma.shortTermListing.findMany({
    where: { ownerId: hostId, listingStatus: "PUBLISHED", nightPriceCents: { gt: 0 } },
    select: { id: true },
    take: 25,
  });
  for (const l of listings) {
    await runBnhubDynamicPricingForListing(hostId, cfg, l.id);
  }
}
