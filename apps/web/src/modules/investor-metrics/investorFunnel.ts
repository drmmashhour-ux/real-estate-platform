import { BookingStatus, PaymentStatus, SearchEventType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { utcDayStart } from "./metricsEngine";

export type InvestorPlatformFunnel = {
  generatedAt: string;
  windowDays: number;
  windowStart: string;
  windowEnd: string;
  /** Distinct analytics sessions with at least one `page_view` (traffic proxy for “visitors”). */
  visitorSessions: number;
  /** Raw page_view row count (includes missing session_id). */
  pageViewEvents: number;
  /** BNHub search / listing detail views (`SearchEvent` VIEW). */
  searchListingViews: number;
  /** Immobilier funnel `listing_view` events (when instrumented). */
  crmListingViews: number;
  /** All bookings created in the window (checkout intent). */
  bookingsCreated: number;
  /** Confirmed or completed stays in window (progression quality). */
  bookingsConfirmedOrCompleted: number;
  /** Stripe-completed BNHub payments in window. */
  paymentsCompleted: number;
  /** Gross charged cents for completed payments in window. */
  paymentVolumeCents: number;
  /** Safe ratios; null when denominator is zero. */
  rates: {
    sessionToListingView: number | null;
    listingViewToBooking: number | null;
    bookingToPayment: number | null;
    sessionToPayment: number | null;
  };
  methodology: string;
};

function safeRate(num: number, den: number): number | null {
  if (den <= 0) return null;
  return num / den;
}

/**
 * Investor funnel: traffic → discovery views → booking → payment (BNHub-aligned where data exists).
 */
export async function loadInvestorPlatformFunnel(asOf: Date, windowDays: number): Promise<InvestorPlatformFunnel> {
  const end = utcDayStart(asOf);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - windowDays);

  const sessionRows = await prisma.$queryRaw<Array<{ c: bigint }>>`
    SELECT COUNT(DISTINCT session_id)::bigint AS c
    FROM traffic_events
    WHERE event_type = 'page_view'
      AND created_at >= ${start}
      AND created_at <= ${asOf}
      AND session_id IS NOT NULL
  `;

  const [
    pageViewEvents,
    searchListingViews,
    crmListingViews,
    bookingsCreated,
    bookingsConfirmedOrCompleted,
    paymentsCompleted,
    paymentAgg,
  ] = await Promise.all([
    prisma.trafficEvent.count({
      where: { eventType: "page_view", createdAt: { gte: start, lte: asOf } },
    }),
    prisma.searchEvent.count({
      where: { eventType: SearchEventType.VIEW, createdAt: { gte: start, lte: asOf } },
    }),
    prisma.analyticsFunnelEvent.count({
      where: { name: "listing_view", createdAt: { gte: start, lte: asOf } },
    }),
    prisma.booking.count({
      where: { createdAt: { gte: start, lte: asOf } },
    }),
    prisma.booking.count({
      where: {
        createdAt: { gte: start, lte: asOf },
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
      },
    }),
    prisma.payment.count({
      where: { status: PaymentStatus.COMPLETED, updatedAt: { gte: start, lte: asOf } },
    }),
    prisma.payment.aggregate({
      where: { status: PaymentStatus.COMPLETED, updatedAt: { gte: start, lte: asOf } },
      _sum: { amountCents: true },
    }),
  ]);

  const visitorSessions = Number(sessionRows[0]?.c ?? 0);
  const viewsForRates = Math.max(searchListingViews, crmListingViews);

  const listingViewToBooking =
    viewsForRates > 0 ? safeRate(bookingsCreated, viewsForRates) : null;
  const bookingToPayment = bookingsCreated > 0 ? safeRate(paymentsCompleted, bookingsCreated) : null;

  return {
    generatedAt: new Date().toISOString(),
    windowDays,
    windowStart: start.toISOString(),
    windowEnd: asOf.toISOString(),
    visitorSessions,
    pageViewEvents,
    searchListingViews,
    crmListingViews,
    bookingsCreated,
    bookingsConfirmedOrCompleted,
    paymentsCompleted,
    paymentVolumeCents: paymentAgg._sum.amountCents ?? 0,
    rates: {
      sessionToListingView: visitorSessions > 0 ? safeRate(viewsForRates, visitorSessions) : null,
      listingViewToBooking,
      bookingToPayment,
      sessionToPayment: visitorSessions > 0 ? safeRate(paymentsCompleted, visitorSessions) : null,
    },
    methodology:
      "Visitors = distinct session_id on traffic_events.page_view. Views = max(SearchEvent VIEW, AnalyticsFunnelEvent listing_view). Bookings = all Booking rows created. Payments = Payment COMPLETED in window. Revenue totals in core metrics use revenue_event; funnel payment volume uses BNHub Payment sums.",
  };
}

export function formatFunnelForReport(f: InvestorPlatformFunnel): string {
  const r = f.rates;
  const pct = (x: number | null) => (x == null ? "n/a" : `${(x * 100).toFixed(2)}%`);
  const lines = [
    `Growth funnel (${f.windowDays}d window ${f.windowStart.slice(0, 10)} → ${f.windowEnd.slice(0, 10)})`,
    `  Distinct visitor sessions (page_view): ${f.visitorSessions}`,
    `  Page view events (all): ${f.pageViewEvents}`,
    `  Listing views (search): ${f.searchListingViews}`,
    `  Listing views (CRM funnel): ${f.crmListingViews}`,
    `  Bookings created: ${f.bookingsCreated}`,
    `  Bookings confirmed/completed: ${f.bookingsConfirmedOrCompleted}`,
    `  Payments completed: ${f.paymentsCompleted}`,
    `  Payment volume (BNHub, cents): ${f.paymentVolumeCents}`,
    `  Rates: session→view ${pct(r.sessionToListingView)} · view→booking ${pct(r.listingViewToBooking)} · booking→pay ${pct(r.bookingToPayment)} · session→pay ${pct(r.sessionToPayment)}`,
    `  Note: ${f.methodology}`,
  ];
  return lines.join("\n");
}
