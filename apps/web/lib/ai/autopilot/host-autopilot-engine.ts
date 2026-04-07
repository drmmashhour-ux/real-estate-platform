import { prisma } from "@/lib/db";
import { optimizeListing } from "@/lib/ai/optimize";
import { logManagerAction, logManagerAgentRun } from "@/lib/ai/logger";
import { toolGetPayoutStatus } from "@/lib/ai/tools/registry";
import { loadResolvedAutonomyConfig } from "@/lib/ai/autonomy/autonomy-state";
import { domainPaused } from "@/lib/ai/policies/domain-policy";
import {
  getHostAutopilotConfig,
  listingWriteDecision,
  touchHostAutopilotRun,
  type HostAutopilotConfig,
} from "./host-config";
import { notifyHostAutopilot } from "./notify-host";
import { requiresApprovalForActionKey } from "./safety";
import { getCalibratedConfidence } from "@/lib/ai/learning/confidence-calibration";
import { gateAutopilotRecommendation } from "@/lib/ai/autopilot/autopilot-gate";
import { reserveAutopilotTemplate } from "@/lib/ai/learning/template-performance";
import { runRevenueOptimizerScan } from "@/lib/ai/autopilot/revenue-optimizer";
import {
  runBnhubDynamicPricingForListing,
  runBnhubDynamicPricingScheduledScan,
} from "@/lib/ai/pricing/dynamic-pricing";
import {
  shouldSuppressAggressiveAutopilotForListing,
  runBnhubFraudScheduledScanForHost,
  runBnhubFraudScanForListing,
} from "@/lib/ai/fraud/fraud-engine";
import { translateServer } from "@/lib/i18n/server-translate";
import { getUserUiLocaleCode } from "@/lib/i18n/user-ui-locale";
import { formatDateForUiLocale } from "@/lib/i18n/format-ui";
import { applyRankingConfidenceBoost, shouldShowRecommendation } from "@/lib/ai/learning/decision-ranking";

export { gateAutopilotRecommendation } from "@/lib/ai/autopilot/autopilot-gate";

export type HostAutopilotTrigger =
  | { type: "booking_created"; bookingId: string; listingId: string; guestId: string }
  | { type: "listing_updated"; listingId: string }
  | { type: "scheduled_scan" };

function photosFromJson(photos: unknown): string[] {
  if (!Array.isArray(photos)) return [];
  return photos.filter((x): x is string => typeof x === "string");
}

async function recentDuplicateRecommendation(userId: string, targetId: string, agentKey: string): Promise<boolean> {
  const since = new Date(Date.now() - 60 * 60 * 1000);
  const hit = await prisma.managerAiRecommendation.findFirst({
    where: {
      userId,
      agentKey,
      targetEntityId: targetId,
      status: "active",
      createdAt: { gte: since },
    },
    select: { id: true },
  });
  return Boolean(hit);
}

async function runListingOptimization(hostId: string, cfg: HostAutopilotConfig, listingId: string): Promise<void> {
  if (!cfg.preferences.autoListingOptimization) return;
  const decision = listingWriteDecision(cfg.autopilotMode);
  if (decision === "none") return;

  const loc = await getUserUiLocaleCode(hostId);

  const row = await prisma.shortTermListing.findFirst({
    where: { id: listingId, ownerId: hostId },
    select: {
      id: true,
      title: true,
      description: true,
      city: true,
      photos: true,
    },
  });
  if (!row) return;
  if (await shouldSuppressAggressiveAutopilotForListing(listingId)) return;

  const input = {
    title: row.title ?? "",
    description: row.description ?? undefined,
    location: { city: row.city ?? undefined },
    photos: photosFromJson(row.photos),
  };
  const out = optimizeListing(input);
  const patch = {
    title: out.optimizedTitle.slice(0, 200),
    description: out.optimizedDescription.slice(0, 8000),
  };

  const actionKey = "host_autopilot_listing_optimization";
  if (requiresApprovalForActionKey(actionKey)) {
    /* listing copy is not financial — safety.ts only flags pricing-like keys */
  }

  if (decision === "suggest") {
    if (await recentDuplicateRecommendation(hostId, listingId, "listing_optimization")) return;
    const gate = await gateAutopilotRecommendation({
      ruleName: "host_autopilot_listing_optimization",
      hostId,
      listingId,
      baseConfidence: 0.75,
      logActionKey: actionKey,
      targetEntityType: "short_term_listing",
      targetEntityId: listingId,
    });
    if (!gate.ok) return;
    const listingRank = await shouldShowRecommendation("host_autopilot_listing_optimization", hostId);
    if (!listingRank.show) return;
    const listingConf = applyRankingConfidenceBoost(gate.confidence, listingRank.reason);
    const autopilotTemplateKey = await reserveAutopilotTemplate("host_autopilot_listing_optimization", hostId);
    await prisma.managerAiRecommendation.create({
      data: {
        userId: hostId,
        agentKey: "listing_optimization",
        title: translateServer(loc, "autopilot.listingOptimizationReadyTitle"),
        description: translateServer(loc, "autopilot.listingOptimizationReadyDescription", {
          keywords: out.seoKeywords.slice(0, 6).join(", "),
        }),
        targetEntityType: "short_term_listing",
        targetEntityId: listingId,
        suggestedAction: JSON.stringify({ patch, seoKeywords: out.seoKeywords, improvements: out.improvements }),
        confidence: listingConf,
        payload: { mode: "assist", patch, autopilotTemplateKey } as object,
      },
    });
    await logManagerAction({
      userId: hostId,
      actionKey,
      targetEntityType: "short_term_listing",
      targetEntityId: listingId,
      status: "suggested",
      decisionScore: gate.decisionScore,
      payload: {
        mode: "ASSIST",
        decisionReasons: gate.reasons,
        decisionBand: gate.band,
        decisionEngine: "multi_factor",
        learningRankReason: listingRank.reason,
      },
    });
    await notifyHostAutopilot({
      userId: hostId,
      locale: loc,
      title: translateServer(loc, "autopilot.listingOptimizationNotifyTitle"),
      message: translateServer(loc, "autopilot.listingOptimizationNotifyMessage"),
      metadata: { listingId },
    });
    return;
  }

  if (decision === "auto_safe") {
    await prisma.shortTermListing.update({
      where: { id: listingId },
      data: { title: patch.title, description: patch.description },
    });
    await logManagerAction({
      userId: hostId,
      actionKey,
      targetEntityType: "short_term_listing",
      targetEntityId: listingId,
      status: "executed",
      payload: { mode: "SAFE_AUTOPILOT", patch },
    });
    await logManagerAgentRun({
      userId: hostId,
      agentKey: "listing_optimization",
      decisionMode: "AUTO_EXECUTE_SAFE",
      inputSummary: `autopilot listing optimization ${listingId}`,
      outputSummary: patch.title.slice(0, 200),
      targetEntityType: "short_term_listing",
      targetEntityId: listingId,
    });
    await notifyHostAutopilot({
      userId: hostId,
      locale: loc,
      title: translateServer(loc, "autopilot.listingAutoUpdatedTitle"),
      message: translateServer(loc, "autopilot.listingAutoUpdatedMessage"),
      metadata: { listingId },
    });
    return;
  }

  /* FULL_AUTOPILOT_APPROVAL — queue approval before writes */
  const listingTpl = await reserveAutopilotTemplate("host_autopilot_listing_optimization", hostId);
  const listingCalConf = await getCalibratedConfidence("host_autopilot_listing_optimization", 0.72);
  await prisma.managerAiApprovalRequest.create({
    data: {
      requesterId: hostId,
      actionKey,
      targetEntityType: "short_term_listing",
      targetEntityId: listingId,
      status: "pending",
      confidence: listingCalConf,
      payload: {
        kind: "listing_optimization_apply",
        patch,
        seoKeywords: out.seoKeywords,
        autopilotTemplateKey: listingTpl,
      } as object,
    },
  });
  await logManagerAction({
    userId: hostId,
    actionKey,
    targetEntityType: "short_term_listing",
    targetEntityId: listingId,
    status: "pending_approval",
    payload: { mode: "FULL_AUTOPILOT_APPROVAL" },
  });
  await notifyHostAutopilot({
    userId: hostId,
    locale: loc,
    title: translateServer(loc, "autopilot.listingApprovalTitle"),
    message: translateServer(loc, "autopilot.listingApprovalMessage"),
    metadata: { listingId },
  });
}

async function runPricingHint(hostId: string, cfg: HostAutopilotConfig, listingId: string): Promise<void> {
  await runBnhubDynamicPricingForListing(hostId, cfg, listingId);
}

async function runBookingMessagingDraft(
  hostId: string,
  cfg: HostAutopilotConfig,
  bookingId: string,
  listingId: string
): Promise<void> {
  if (!cfg.preferences.autoMessaging) return;
  if (cfg.autopilotMode === "OFF") return;

  const loc = await getUserUiLocaleCode(hostId);

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, listingId },
    include: { guest: { select: { name: true } }, listing: { select: { title: true } } },
  });
  if (!booking) return;

  const draft = translateServer(loc, "autopilot.guestDraftTemplate", {
    guestGreeting: booking.guest.name ? ` ${booking.guest.name.split(" ")[0]}` : "",
    listingTitle: booking.listing.title.slice(0, 60),
  });

  if (await recentDuplicateRecommendation(hostId, bookingId, "host_management")) return;

  const msgGate = await gateAutopilotRecommendation({
    ruleName: "host_autopilot_message_draft",
    hostId,
    listingId,
    baseConfidence: 0.65,
    logActionKey: "host_autopilot_message_draft",
    targetEntityType: "booking",
    targetEntityId: bookingId,
  });
  if (!msgGate.ok) return;

  const msgRank = await shouldShowRecommendation("host_autopilot_message_draft", hostId);
  if (!msgRank.show) return;
  const msgConf = applyRankingConfidenceBoost(msgGate.confidence, msgRank.reason);

  const msgTpl = await reserveAutopilotTemplate("host_autopilot_message_draft", hostId);
  await prisma.managerAiRecommendation.create({
    data: {
      userId: hostId,
      agentKey: "host_management",
      title: translateServer(loc, "autopilot.guestDraftTitle"),
      description: draft,
      targetEntityType: "booking",
      targetEntityId: bookingId,
      suggestedAction: JSON.stringify({ draft, sendFromInbox: true }),
      confidence: msgConf,
      payload: { listingId, autopilotTemplateKey: msgTpl } as object,
    },
  });
  await logManagerAction({
    userId: hostId,
    actionKey: "host_autopilot_message_draft",
    targetEntityType: "booking",
    targetEntityId: bookingId,
    status: "suggested",
    decisionScore: msgGate.decisionScore,
    payload: {
      autopilotMode: cfg.autopilotMode,
      decisionReasons: msgGate.reasons,
      decisionBand: msgGate.band,
      decisionEngine: "multi_factor",
      learningRankReason: msgRank.reason,
    },
  });
  await notifyHostAutopilot({
    userId: hostId,
    locale: loc,
    title: translateServer(loc, "autopilot.guestDraftNotifyTitle"),
    message: translateServer(loc, "autopilot.guestDraftNotifyMessage"),
    metadata: { bookingId, listingId },
  });
}

async function runPromotionSuggestion(hostId: string, cfg: HostAutopilotConfig, listingId: string): Promise<void> {
  if (!cfg.preferences.autoPromotions) return;
  if (cfg.autopilotMode === "OFF") return;
  if (await shouldSuppressAggressiveAutopilotForListing(listingId)) return;
  if (await recentDuplicateRecommendation(hostId, listingId, "revenue")) return;

  const loc = await getUserUiLocaleCode(hostId);

  const promoGate = await gateAutopilotRecommendation({
    ruleName: "host_autopilot_promotion_suggestion",
    hostId,
    listingId,
    baseConfidence: 0.5,
    logActionKey: "host_autopilot_promotion_suggestion",
    targetEntityType: "short_term_listing",
    targetEntityId: listingId,
  });
  if (!promoGate.ok) return;

  const promoRank = await shouldShowRecommendation("host_autopilot_promotion_suggestion", hostId);
  if (!promoRank.show) return;
  const promoConf = applyRankingConfidenceBoost(promoGate.confidence, promoRank.reason);

  const promoTpl = await reserveAutopilotTemplate("host_autopilot_promotion_suggestion", hostId);
  await prisma.managerAiRecommendation.create({
    data: {
      userId: hostId,
      agentKey: "revenue",
      title: translateServer(loc, "autopilot.promotionIdeaTitle"),
      description: translateServer(loc, "autopilot.promotionIdeaDescription"),
      targetEntityType: "short_term_listing",
      targetEntityId: listingId,
      suggestedAction: JSON.stringify({ type: "weekday_discount", percent: 5 }),
      confidence: promoConf,
      payload: { autopilot: true, autopilotTemplateKey: promoTpl } as object,
    },
  });
  await logManagerAction({
    userId: hostId,
    actionKey: "host_autopilot_promotion_suggestion",
    targetEntityType: "short_term_listing",
    targetEntityId: listingId,
    status: "suggested",
    decisionScore: promoGate.decisionScore,
    payload: {
      decisionReasons: promoGate.reasons,
      decisionBand: promoGate.band,
      decisionEngine: "multi_factor",
      learningRankReason: promoRank.reason,
    },
  });
  await notifyHostAutopilot({
    userId: hostId,
    locale: loc,
    title: translateServer(loc, "autopilot.promotionNotifyTitle"),
    message: translateServer(loc, "autopilot.promotionNotifyMessage"),
    metadata: { listingId },
  });
}

async function runStalledBookings(hostId: string, cfg: HostAutopilotConfig): Promise<void> {
  if (cfg.autopilotMode === "OFF" || !cfg.autopilotEnabled) return;
  const loc = await getUserUiLocaleCode(hostId);
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const stalled = await prisma.booking.findMany({
    where: {
      status: "AWAITING_HOST_APPROVAL",
      listing: { ownerId: hostId },
      createdAt: { lt: cutoff },
    },
    select: { id: true, listingId: true, listing: { select: { title: true } } },
    take: 10,
  });
  for (const b of stalled) {
    if (await recentDuplicateRecommendation(hostId, b.id, "booking_ops")) continue;
    const stalledGate = await gateAutopilotRecommendation({
      ruleName: "host_autopilot_stalled_booking",
      hostId,
      listingId: b.listingId,
      baseConfidence: 0.9,
      logActionKey: "host_autopilot_stalled_booking",
      targetEntityType: "booking",
      targetEntityId: b.id,
    });
    if (!stalledGate.ok) continue;
    const stalledRank = await shouldShowRecommendation("host_autopilot_stalled_booking", hostId);
    if (!stalledRank.show) continue;
    const stalledConf = applyRankingConfidenceBoost(stalledGate.confidence, stalledRank.reason);
    const stalledTpl = await reserveAutopilotTemplate("host_autopilot_stalled_booking", hostId);
    const stalledListingTitle = b.listing.title.slice(0, 60);
    const beforeDate = formatDateForUiLocale(cutoff, loc, "short");
    await prisma.managerAiRecommendation.create({
      data: {
        userId: hostId,
        agentKey: "booking_ops",
        title: translateServer(loc, "autopilot.stalledBookingRecTitle"),
        description: translateServer(loc, "autopilot.stalledBookingRecDescription", {
          listingTitle: stalledListingTitle,
          beforeDate,
        }),
        targetEntityType: "booking",
        targetEntityId: b.id,
        suggestedAction: JSON.stringify({ action: "review_booking", bookingId: b.id }),
        confidence: stalledConf,
        payload: { listingId: b.listingId, autopilotTemplateKey: stalledTpl } as object,
      },
    });
    await logManagerAction({
      userId: hostId,
      actionKey: "host_autopilot_stalled_booking",
      targetEntityType: "booking",
      targetEntityId: b.id,
      status: "suggested",
      decisionScore: stalledGate.decisionScore,
      payload: {
        decisionReasons: stalledGate.reasons,
        decisionBand: stalledGate.band,
        decisionEngine: "multi_factor",
        learningRankReason: stalledRank.reason,
      },
    });
    const stalledNotifyTitle =
      b.listing.title.length > 40 ? `${b.listing.title.slice(0, 40)}…` : b.listing.title;
    await notifyHostAutopilot({
      userId: hostId,
      locale: loc,
      title: translateServer(loc, "autopilot.stalledBookingNotifyTitle"),
      message: translateServer(loc, "autopilot.stalledBookingNotifyMessage", { listingTitle: stalledNotifyTitle }),
      actionUrl: `/bnhub/booking/${b.id}`,
      metadata: { bookingId: b.id },
    });
  }
}

async function runPayoutReadiness(hostId: string, cfg: HostAutopilotConfig): Promise<void> {
  if (cfg.autopilotMode === "OFF" || !cfg.autopilotEnabled) return;
  const loc = await getUserUiLocaleCode(hostId);
  const payout = await toolGetPayoutStatus(hostId);
  if (!payout.ok) return;
  const ready = Boolean(payout.data.stripeOnboardingComplete && payout.data.stripeAccountId);
  if (ready) return;
  if (await recentDuplicateRecommendation(hostId, hostId, "host_autopilot_payout")) return;

  const payoutGate = await gateAutopilotRecommendation({
    ruleName: "host_autopilot_payout_hint",
    hostId,
    baseConfidence: 0.95,
    logActionKey: "host_autopilot_payout_hint",
    targetEntityType: "user",
    targetEntityId: hostId,
  });
  if (!payoutGate.ok) return;

  const payoutTpl = await reserveAutopilotTemplate("host_autopilot_payout_hint", hostId);
  await prisma.managerAiRecommendation.create({
    data: {
      userId: hostId,
      agentKey: "host_autopilot_payout",
      title: translateServer(loc, "autopilot.payoutIncompleteTitle"),
      description: translateServer(loc, "autopilot.payoutIncompleteDescription"),
      targetEntityType: "user",
      targetEntityId: hostId,
      suggestedAction: JSON.stringify({ openStripeOnboarding: true }),
      confidence: payoutGate.confidence,
      payload: { autopilotTemplateKey: payoutTpl } as object,
    },
  });
  await logManagerAction({
    userId: hostId,
    actionKey: "host_autopilot_payout_hint",
    targetEntityType: "user",
    targetEntityId: hostId,
    status: "suggested",
    decisionScore: payoutGate.decisionScore,
    payload: {
      decisionReasons: payoutGate.reasons,
      decisionBand: payoutGate.band,
      decisionEngine: "multi_factor",
    },
  });
  await notifyHostAutopilot({
    userId: hostId,
    locale: loc,
    title: translateServer(loc, "autopilot.payoutNotifyTitle"),
    message: translateServer(loc, "autopilot.payoutNotifyMessage"),
    actionUrl: "/dashboard/host/payouts",
  });
}

async function runLowPerformanceListings(hostId: string, cfg: HostAutopilotConfig): Promise<void> {
  if (cfg.autopilotMode === "OFF" || !cfg.autopilotEnabled) return;
  const loc = await getUserUiLocaleCode(hostId);
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const listings = await prisma.shortTermListing.findMany({
    where: { ownerId: hostId, listingStatus: "PUBLISHED" },
    select: { id: true, title: true },
    take: 20,
  });
  for (const l of listings) {
    const bookings = await prisma.booking.count({
      where: {
        listingId: l.id,
        status: { in: ["CONFIRMED", "COMPLETED", "PENDING"] },
        createdAt: { gte: since },
      },
    });
    if (bookings > 0) continue;
    if (await recentDuplicateRecommendation(hostId, l.id, "listing_optimization")) continue;
    const lowGate = await gateAutopilotRecommendation({
      ruleName: "host_autopilot_low_performance",
      hostId,
      listingId: l.id,
      baseConfidence: 0.6,
      logActionKey: "host_autopilot_low_performance",
      targetEntityType: "short_term_listing",
      targetEntityId: l.id,
    });
    if (!lowGate.ok) continue;
    const lowRank = await shouldShowRecommendation("host_autopilot_low_performance", hostId);
    if (!lowRank.show) continue;
    const lowConf = applyRankingConfidenceBoost(lowGate.confidence, lowRank.reason);
    const lowTpl = await reserveAutopilotTemplate("host_autopilot_low_performance", hostId);
    await prisma.managerAiRecommendation.create({
      data: {
        userId: hostId,
        agentKey: "listing_optimization",
        title: translateServer(loc, "autopilot.lowBookingsTitle"),
        description: translateServer(loc, "autopilot.lowBookingsDescription", {
          listingTitle: l.title.slice(0, 80),
        }),
        targetEntityType: "short_term_listing",
        targetEntityId: l.id,
        suggestedAction: JSON.stringify({ reviewListing: true }),
        confidence: lowConf,
        payload: { autopilotTemplateKey: lowTpl } as object,
      },
    });
    await logManagerAction({
      userId: hostId,
      actionKey: "host_autopilot_low_performance",
      targetEntityType: "short_term_listing",
      targetEntityId: l.id,
      status: "suggested",
      decisionScore: lowGate.decisionScore,
      payload: {
        decisionReasons: lowGate.reasons,
        decisionBand: lowGate.band,
        decisionEngine: "multi_factor",
        learningRankReason: lowRank.reason,
      },
    });
  }
}

export async function runHostAutopilotTrigger(hostId: string, trigger: HostAutopilotTrigger): Promise<void> {
  const cfg = await getHostAutopilotConfig(hostId);
  if (!cfg.autopilotEnabled || cfg.autopilotMode === "OFF") return;

  const plat = await loadResolvedAutonomyConfig();
  if (plat.globalKillSwitch) return;
  if (plat.autonomyPausedUntil && plat.autonomyPausedUntil > new Date()) return;
  if (plat.normalizedMode === "OFF") return;
  if (domainPaused("host_autopilot", plat.domainKillSwitchesJson)) return;

  try {
    if (trigger.type === "listing_updated") {
      await runBnhubFraudScanForListing(trigger.listingId);
      await runListingOptimization(hostId, cfg, trigger.listingId);
      await runPricingHint(hostId, cfg, trigger.listingId);
      if (cfg.preferences.autoPromotions) await runPromotionSuggestion(hostId, cfg, trigger.listingId);
    } else if (trigger.type === "booking_created") {
      await runBookingMessagingDraft(hostId, cfg, trigger.bookingId, trigger.listingId);
      await runPricingHint(hostId, cfg, trigger.listingId);
    } else if (trigger.type === "scheduled_scan") {
      await runStalledBookings(hostId, cfg);
      await runPayoutReadiness(hostId, cfg);
      await runLowPerformanceListings(hostId, cfg);
      await runBnhubFraudScheduledScanForHost(hostId);
      await runRevenueOptimizerScan(hostId, cfg);
      await runBnhubDynamicPricingScheduledScan(hostId, cfg);
    }
    await touchHostAutopilotRun(hostId);
  } catch (e) {
    await logManagerAction({
      userId: hostId,
      actionKey: "host_autopilot_engine_error",
      targetEntityType: "user",
      targetEntityId: hostId,
      status: "failed",
      error: { message: e instanceof Error ? e.message : String(e) },
      payload: { trigger },
    });
  }
}
