import { prisma } from "@/lib/db";
import { GrowthEventName } from "@/modules/growth/event-types";
import { startOfUtcDay } from "@/modules/analytics/services/get-platform-stats";

function addDays(d: Date, days: number): Date {
  const n = new Date(d);
  n.setUTCDate(n.getUTCDate() + days);
  return n;
}

function pct(n: number, d: number): number {
  if (!d) return 0;
  return Math.round((n / d) * 10_000) / 100;
}

/**
 * Admin JSON for LECIPM Growth System — uses `traffic_events`, `marketing_settings.manual_ad_spend_cad`,
 * and paid `platform_payments` (real revenue only). Ad spend is manual until Ads API is wired.
 */
export async function getGrowthRoiAnalytics(days = 30) {
  const end = addDays(startOfUtcDay(new Date()), 1);
  const start = addDays(end, -Math.max(1, Math.min(180, days)));

  const marketing = await prisma.marketingSettings.findUnique({ where: { id: "default" } });
  const adSpendCad = marketing?.manualAdSpendCad ?? 0;
  const adSpendCents = adSpendCad * 100;

  const [
    lpViews,
    adClicks,
    ctaClicks,
    signups,
    hostSignups,
    brokerLeads,
    bookingStarted,
    bookingCompleted,
    revenueRows,
    bookingPayments,
    growthSignups,
    growthBookingsDone,
  ] = await Promise.all([
    prisma.trafficEvent.count({
      where: {
        eventType: "page_view",
        path: { contains: "/lp/" },
        createdAt: { gte: start, lt: end },
      },
    }),
    prisma.trafficEvent.count({
      where: { eventType: "ad_click", createdAt: { gte: start, lt: end } },
    }),
    prisma.trafficEvent.count({
      where: { eventType: "cta_click", createdAt: { gte: start, lt: end } },
    }),
    prisma.trafficEvent.count({
      where: { eventType: "signup_completed", createdAt: { gte: start, lt: end } },
    }),
    prisma.trafficEvent.count({
      where: { eventType: "host_signup", createdAt: { gte: start, lt: end } },
    }),
    prisma.trafficEvent.count({
      where: { eventType: "broker_lead", createdAt: { gte: start, lt: end } },
    }),
    prisma.trafficEvent.count({
      where: { eventType: "booking_started", createdAt: { gte: start, lt: end } },
    }),
    prisma.trafficEvent.count({
      where: { eventType: "booking_completed", createdAt: { gte: start, lt: end } },
    }),
    prisma.platformPayment.findMany({
      where: {
        status: "paid",
        createdAt: { gte: start, lt: end },
        paymentType: { in: ["lead_marketplace", "lead_unlock", "subscription", "booking"] },
      },
      select: { amountCents: true, paymentType: true },
    }),
    prisma.platformPayment.findMany({
      where: {
        status: "paid",
        paymentType: "booking",
        createdAt: { gte: start, lt: end },
      },
      select: { amountCents: true },
    }),
    prisma.growthEvent.count({
      where: {
        eventName: GrowthEventName.SIGNUP_SUCCESS,
        createdAt: { gte: start, lt: end },
      },
    }),
    prisma.growthEvent.count({
      where: {
        eventName: GrowthEventName.BOOKING_COMPLETED,
        createdAt: { gte: start, lt: end },
      },
    }),
  ]);

  const revenueCents = revenueRows.reduce((acc, r) => acc + r.amountCents, 0);
  const bookingRevenueCents = bookingPayments.reduce((acc, r) => acc + r.amountCents, 0);
  const paidBookingCount = bookingPayments.length;
  const avgRevenuePerBookingCents =
    paidBookingCount > 0 ? Math.round(bookingRevenueCents / paidBookingCount) : null;
  /** Rough “revenue per acquired user” — not cohort LTV; uses period signups as denominator. */
  const revenuePerSignupCents = signups > 0 ? Math.round(revenueCents / signups) : null;
  /** Leads for CPL: verified signups + explicit broker LP intents (not duplicated with host_signup rows). */
  const leadEvents = signups + brokerLeads;
  const costPerLeadCents = leadEvents > 0 ? Math.round(adSpendCents / leadEvents) : null;
  const cacVsLtvProxyRatio =
    costPerLeadCents != null && revenuePerSignupCents != null && costPerLeadCents > 0
      ? Math.round((revenuePerSignupCents / costPerLeadCents) * 100) / 100
      : null;

  const funnelSteps = [
    { step: "ad_click", count: adClicks },
    { step: "lp_page_view", count: lpViews },
    { step: "cta_click", count: ctaClicks },
    { step: "signup_completed", count: signups },
    { step: "booking_started", count: bookingStarted },
    { step: "booking_completed", count: bookingCompleted },
  ];
  const funnel = funnelSteps.map((row, i) => {
    const prevCount = i > 0 ? funnelSteps[i - 1]!.count : null;
    const retentionFromPrior =
      prevCount != null && prevCount > 0 ? pct(row.count, prevCount) : null;
    return { ...row, retentionFromPrior };
  });

  return {
    range: { days, start: start.toISOString(), end: end.toISOString() },
    inputs: {
      manualAdSpendCad: adSpendCad,
      note:
        "Cost metrics use Marketing Settings manual ad spend (CAD). Connect Google Ads API or import spend for production ROI.",
    },
    totals: {
      lpViews,
      adClicks,
      ctaClicks,
      signups,
      hostSignups,
      brokerLeads,
      bookingStarted,
      bookingCompleted,
      revenueCents,
      leadEvents,
      /** `growth_events` rows (server-written signups / Stripe webhook bookings). */
      growthSignupsVerified: growthSignups,
      growthBookingsCompletedVerified: growthBookingsDone,
      paidBnhubBookingPayments: paidBookingCount,
      bookingRevenueCents,
    },
    costs: {
      costPerLeadCents,
      costPerBookingCents: bookingCompleted > 0 ? Math.round(adSpendCents / bookingCompleted) : null,
    },
    unitEconomics: {
      avgRevenuePerBookingCents,
      revenuePerSignupCents,
      /** Revenue-per-signup ÷ CPL — proxy only; true LTV needs cohort modeling. */
      cacVsLtvProxyRatio,
    },
    rates: {
      signupPerLpView: pct(signups, lpViews),
      bookingPerSignup: pct(bookingCompleted, signups),
      conversionBookingPerStarted: pct(bookingCompleted, bookingStarted),
    },
    revenueVsSpend: {
      revenueCents,
      adSpendCents,
      roas: adSpendCents > 0 ? Math.round((revenueCents / adSpendCents) * 100) / 100 : null,
    },
    funnel,
  };
}
