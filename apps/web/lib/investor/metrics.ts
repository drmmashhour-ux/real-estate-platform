import {
  BookingStatus,
  BnhubMpPayoutStatus,
  ListingStatus,
  PaymentStatus,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import type {
  InvestorDateRange,
  InvestorMetricsSnapshot,
  InvestorTimeWindow,
  TopRuleRow,
} from "./metrics-types";

const VALID_WINDOWS: InvestorTimeWindow[] = ["all", "today", "7d", "30d"];

export function parseInvestorTimeWindow(raw: string | undefined): InvestorTimeWindow {
  if (raw && VALID_WINDOWS.includes(raw as InvestorTimeWindow)) {
    return raw as InvestorTimeWindow;
  }
  return "30d";
}

export function getDateRangeForWindow(w: InvestorTimeWindow): InvestorDateRange {
  const end = new Date();
  if (w === "all") {
    return { start: null, end, label: "All time" };
  }
  const start = new Date(end);
  if (w === "today") {
    start.setUTCHours(0, 0, 0, 0);
    return { start, end, label: "Today (UTC)" };
  }
  if (w === "7d") {
    start.setTime(end.getTime() - 7 * 86400000);
    return { start, end, label: "Last 7 days" };
  }
  start.setTime(end.getTime() - 30 * 86400000);
  return { start, end, label: "Last 30 days" };
}

function createdInRangeWhere(range: InvestorDateRange): { createdAt?: { gte: Date; lte: Date } } {
  if (!range.start) return {};
  return { createdAt: { gte: range.start, lte: range.end } };
}

const CANCELLED: BookingStatus[] = [
  BookingStatus.CANCELLED_BY_GUEST,
  BookingStatus.CANCELLED_BY_HOST,
  BookingStatus.CANCELLED,
];

const PAYOUT_PENDING_LIKE: BnhubMpPayoutStatus[] = [
  BnhubMpPayoutStatus.PENDING,
  BnhubMpPayoutStatus.SCHEDULED,
  BnhubMpPayoutStatus.HELD,
  BnhubMpPayoutStatus.IN_TRANSIT,
];

function sortTopRules(rows: { actionKey: string; _count: { _all: number } }[]): TopRuleRow[] {
  return rows
    .map((g) => ({ actionKey: g.actionKey, count: g._count._all }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

/**
 * Aggregates real DB metrics for the internal investor dashboard.
 */
export async function fetchInvestorMetricsSnapshot(
  window: InvestorTimeWindow,
): Promise<InvestorMetricsSnapshot> {
  const range = getDateRangeForWindow(window);
  const cw = createdInRangeWhere(range);
  const unavailable: string[] = ["conversion_rate", "marketing_funnel"];
  const todayUtc = new Date();
  todayUtc.setUTCHours(0, 0, 0, 0);

  const [
    publishedListings,
    approvedListings,
    draftListings,
    pendingReviewListings,
    hostOwnerGroups,
    listingsWithActivePromotion,
    hostsWithAutopilotEnabled,
    createdInRange,
    confirmedInRange,
    completedInRange,
    cancelledInRange,
    pendingNow,
    totalBookingsAllTime,
    gmvAgg,
    platformFeeAgg,
    bnhubFeeAgg,
    bnhubPaidAgg,
    bnhubPending,
    recs,
    approvalsPending,
    actionsExec,
    overrides,
    healthEv,
    suppressed,
    actionGroups,
    agentRunsDone,
    agentRunsFail,
    countryGroups,
    localeGroups,
    newListings,
    launch,
  ] = await Promise.all([
    prisma.shortTermListing.count({ where: { listingStatus: ListingStatus.PUBLISHED } }),
    prisma.shortTermListing.count({ where: { listingStatus: ListingStatus.APPROVED } }),
    prisma.shortTermListing.count({ where: { listingStatus: ListingStatus.DRAFT } }),
    prisma.shortTermListing.count({ where: { listingStatus: ListingStatus.PENDING_REVIEW } }),
    prisma.shortTermListing.groupBy({ by: ["ownerId"], _count: true }),
    prisma.bnhubHostListingPromotion.count({
      where: { active: true, startDate: { lte: todayUtc }, endDate: { gte: todayUtc } },
    }),
    prisma.managerAiHostAutopilotSettings.count({ where: { autopilotEnabled: true } }),
    prisma.booking.count({ where: cw }),
    prisma.booking.count({
      where: { ...cw, status: BookingStatus.CONFIRMED },
    }),
    prisma.booking.count({
      where: { ...cw, status: BookingStatus.COMPLETED },
    }),
    prisma.booking.count({
      where: { ...cw, status: { in: CANCELLED } },
    }),
    prisma.booking.count({
      where: { status: { in: [BookingStatus.PENDING, BookingStatus.AWAITING_HOST_APPROVAL] } },
    }),
    prisma.booking.count(),
    prisma.booking.aggregate({
      where: cw,
      _sum: { totalCents: true },
    }),
    prisma.payment.aggregate({
      where: {
        status: PaymentStatus.COMPLETED,
        ...cw,
      },
      _sum: { platformFeeCents: true },
    }),
    prisma.bnhubHostPayoutRecord.aggregate({
      where: cw,
      _sum: { platformFeeCents: true },
    }),
    prisma.bnhubHostPayoutRecord.aggregate({
      where: {
        payoutStatus: BnhubMpPayoutStatus.PAID,
        ...(range.start
          ? { releasedAt: { gte: range.start, lte: range.end } }
          : { releasedAt: { not: null } }),
      },
      _sum: { netAmountCents: true },
      _count: true,
    }),
    prisma.bnhubHostPayoutRecord.findMany({
      where: { payoutStatus: { in: PAYOUT_PENDING_LIKE } },
      select: { netAmountCents: true },
    }),
    prisma.managerAiRecommendation.count({ where: cw }),
    prisma.managerAiApprovalRequest.count({ where: { status: "pending" } }),
    prisma.managerAiActionLog.count({
      where: { ...cw, status: "executed" },
    }),
    prisma.managerAiOverrideEvent.count({ where: cw }),
    prisma.managerAiHealthEvent.count({ where: cw }),
    prisma.managerAiActionLog.count({
      where: {
        ...cw,
        OR: [{ status: "suppressed" }, { suppressionReason: { not: null } }],
      },
    }),
    prisma.managerAiActionLog.groupBy({
      by: ["actionKey"],
      where: cw,
      _count: { _all: true },
    }),
    prisma.managerAiAgentRun.count({
      where: { ...cw, status: "completed" },
    }),
    prisma.managerAiAgentRun.count({
      where: { ...cw, status: "failed" },
    }),
    prisma.shortTermListing.groupBy({
      by: ["country"],
      _count: { _all: true },
    }),
    prisma.user.groupBy({
      by: ["preferredUiLocale"],
      where: { preferredUiLocale: { not: null } },
      _count: { _all: true },
    }),
    prisma.shortTermListing.count({ where: cw }),
    prisma.platformMarketLaunchSettings.findUnique({
      where: { id: "default" },
      select: {
        syriaModeEnabled: true,
        onlinePaymentsEnabled: true,
        activeMarketCode: true,
      },
    }),
  ]);

  const bnhubPendingNetSum = bnhubPending.reduce((s, x) => s + x.netAmountCents, 0);

  const countrySorted = [...countryGroups]
    .map((g) => ({ country: g.country || "unknown", count: g._count._all }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  const localeSorted = [...localeGroups]
    .map((g) => ({ locale: g.preferredUiLocale ?? "unknown", count: g._count._all }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return {
    window,
    generatedAt: new Date().toISOString(),
    range,
    marketplace: {
      publishedListings,
      approvedListings,
      draftListings,
      pendingReviewListings,
      incompleteListings: draftListings + pendingReviewListings,
      hostsWithListings: hostOwnerGroups.length,
      hostsWithAutopilotEnabled,
      listingsWithActivePromotion,
    },
    bookings: {
      createdInRange,
      confirmedInRange,
      completedInRange,
      cancelledInRange,
      pendingNow,
      totalBookingsAllTime,
    },
    revenue: {
      bookingTotalCentsGmvProxyInRange: gmvAgg._sum.totalCents ?? null,
      stripePaymentPlatformFeeCentsInRange: platformFeeAgg._sum.platformFeeCents ?? null,
      bnhubPayoutPlatformFeeCentsInRange: bnhubFeeAgg._sum.platformFeeCents ?? null,
      bnhubPayoutsPaidCountInRange: bnhubPaidAgg._count,
      bnhubPayoutsPaidNetCentsInRange: bnhubPaidAgg._sum.netAmountCents ?? null,
      bnhubPayoutsPendingOrInFlightCount: bnhubPending.length,
      bnhubPayoutsPendingOrInFlightNetCents: bnhubPending.length ? bnhubPendingNetSum : null,
    },
    ai: {
      managerRecommendationsCreatedInRange: recs,
      managerApprovalsPendingNow: approvalsPending,
      managerActionsExecutedInRange: actionsExec,
      managerOverrideEventsInRange: overrides,
      managerHealthEventsInRange: healthEv,
      managerActionLogsSuppressedInRange: suppressed,
      topActionKeysInRange: sortTopRules(actionGroups),
      managerAgentRunsCompletedInRange: agentRunsDone,
      managerAgentRunsFailedInRange: agentRunsFail,
    },
    geography: {
      strListingsByCountry: countrySorted,
    },
    platform: {
      syriaModeEnabled: launch?.syriaModeEnabled ?? null,
      onlinePaymentsEnabled: launch?.onlinePaymentsEnabled ?? null,
      activeMarketCode: launch?.activeMarketCode ?? null,
    },
    users: {
      preferredUiLocaleBuckets: localeSorted,
    },
    growth: {
      newStrListingsCreatedInRange: newListings,
    },
    unavailable,
  };
}
