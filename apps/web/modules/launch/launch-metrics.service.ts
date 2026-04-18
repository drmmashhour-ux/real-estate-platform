/**
 * LECIPM Launch + Fraud Protection System v1 — funnel metrics from `user_events` + payments.
 */
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export type LaunchFunnelMetrics = {
  periodDays: number;
  counts: {
    ad_click: number;
    landing_view: number;
    listing_view: number;
    booking_start: number;
    checkout: number;
    booking_completed: number;
  };
  usersAcquired: number;
  revenueCents: number;
  conversionRates: {
    landingToListing: number | null;
    listingToBookingStart: number | null;
    bookingStartToCheckout: number | null;
    checkoutToComplete: number | null;
    overallFunnel: number | null;
  };
  dropOffPct: {
    landingToListing: number | null;
    listingToBookingStart: number | null;
  };
  revenuePerUserCents: number | null;
  cacEstimateCents: number | null;
};

async function countRawMeta(since: Date, rawEventType: string): Promise<number> {
  const rows = await prisma.$queryRaw<[{ c: bigint }]>`
    SELECT COUNT(*)::bigint AS c
    FROM user_events
    WHERE created_at >= ${since}
      AND metadata->>'rawEventType' = ${rawEventType}
  `;
  return Number(rows[0]?.c ?? 0);
}

/**
 * Best-effort funnel using mapped `event_type` + JSON `rawEventType` where applicable.
 */
export async function getLaunchFunnelMetrics(periodDays = 30): Promise<LaunchFunnelMetrics> {
  const since = new Date();
  since.setDate(since.getDate() - periodDays);

  const [
    listingViewMapped,
    bookingStartMapped,
    checkoutMapped,
    paymentSuccessMapped,
    visitPage,
    ad_click,
    landing_view_meta,
    usersAcquired,
    revenueAgg,
  ] = await Promise.all([
    prisma.userEvent.count({
      where: { createdAt: { gte: since }, eventType: "LISTING_VIEW" },
    }),
    prisma.userEvent.count({
      where: { createdAt: { gte: since }, eventType: "BOOKING_START" },
    }),
    prisma.userEvent.count({
      where: { createdAt: { gte: since }, eventType: "CHECKOUT_START" },
    }),
    prisma.userEvent.count({
      where: { createdAt: { gte: since }, eventType: "PAYMENT_SUCCESS" },
    }),
    prisma.userEvent.count({
      where: { createdAt: { gte: since }, eventType: "VISIT_PAGE" },
    }),
    countRawMeta(since, "ad_click"),
    countRawMeta(since, "landing_view"),
    prisma.user.count({ where: { createdAt: { gte: since } } }).catch(() => 0),
    prisma.platformPayment
      .aggregate({
        where: { status: "paid", createdAt: { gte: since } },
        _sum: { amountCents: true },
      })
      .catch(() => ({ _sum: { amountCents: 0 } })),
  ]);

  const listing_view = listingViewMapped;
  const booking_start = bookingStartMapped;
  const checkout = checkoutMapped;
  const booking_completed = paymentSuccessMapped;
  const landing_view = Math.max(visitPage + landing_view_meta, 1);

  const revenueCents = revenueAgg._sum.amountCents ?? 0;

  const landingToListing = landing_view > 0 ? listing_view / landing_view : null;
  const listingToBookingStart = listing_view > 0 ? booking_start / listing_view : null;
  const bookingStartToCheckout = booking_start > 0 ? checkout / booking_start : null;
  const checkoutToComplete = checkout > 0 ? booking_completed / checkout : null;
  const overallFunnel = landing_view > 0 ? booking_completed / landing_view : null;

  const revenuePerUserCents =
    usersAcquired > 0 ? Math.round(revenueCents / usersAcquired) : null;

  return {
    periodDays,
    counts: {
      ad_click,
      landing_view,
      listing_view,
      booking_start,
      checkout,
      booking_completed,
    },
    usersAcquired,
    revenueCents,
    conversionRates: {
      landingToListing,
      listingToBookingStart,
      bookingStartToCheckout,
      checkoutToComplete,
      overallFunnel,
    },
    dropOffPct: {
      landingToListing: landingToListing != null ? Math.max(0, (1 - landingToListing) * 100) : null,
      listingToBookingStart:
        listingToBookingStart != null ? Math.max(0, (1 - listingToBookingStart) * 100) : null,
    },
    revenuePerUserCents,
    cacEstimateCents: null,
  };
}
