import { PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

const LEAD_TYPES = new Set(["listing_contact_lead", "lead_marketplace", "lead_unlock", "mortgage_contact_unlock"]);
const BOOKING_TYPES = new Set(["booking"]);
const FEATURED_TYPES = new Set(["featured_listing"]);

export type MonetizationStreamKey = "leads" | "bookings" | "featured" | "other";

function streamForPaymentType(paymentType: string): MonetizationStreamKey {
  if (LEAD_TYPES.has(paymentType)) return "leads";
  if (BOOKING_TYPES.has(paymentType)) return "bookings";
  if (FEATURED_TYPES.has(paymentType)) return "featured";
  return "other";
}

export type PlatformPaymentWindowStats = {
  totalCents: number;
  leadsCents: number;
  bookingsCents: number;
  featuredCents: number;
  otherCents: number;
};

function emptyWindow(): PlatformPaymentWindowStats {
  return {
    totalCents: 0,
    leadsCents: 0,
    bookingsCents: 0,
    featuredCents: 0,
    otherCents: 0,
  };
}

function accumulate(acc: PlatformPaymentWindowStats, paymentType: string, amountCents: number): void {
  acc.totalCents += amountCents;
  const s = streamForPaymentType(paymentType);
  if (s === "leads") acc.leadsCents += amountCents;
  else if (s === "bookings") acc.bookingsCents += amountCents;
  else if (s === "featured") acc.featuredCents += amountCents;
  else acc.otherCents += amountCents;
}

/**
 * Rolls up paid `PlatformPayment` rows (Stripe checkout) by monetization stream for admin dashboards.
 */
async function sumBookingPlatformFees(from: Date, to: Date): Promise<number> {
  const agg = await prisma.payment.aggregate({
    where: {
      status: PaymentStatus.COMPLETED,
      platformFeeCents: { not: null },
      updatedAt: { gte: from, lte: to },
    },
    _sum: { platformFeeCents: true },
  });
  return agg._sum.platformFeeCents ?? 0;
}

export async function getPlatformPaymentMonetizationBreakdown(): Promise<{
  today: PlatformPaymentWindowStats;
  last7d: PlatformPaymentWindowStats;
  last30d: PlatformPaymentWindowStats;
}> {
  const now = new Date();
  const start30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const rows = await prisma.platformPayment.findMany({
    where: {
      status: "paid",
      createdAt: { gte: start30 },
    },
    select: { paymentType: true, amountCents: true, createdAt: true },
  });

  const dayStart = new Date(now);
  dayStart.setUTCHours(0, 0, 0, 0);
  const start7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const today = emptyWindow();
  const last7d = emptyWindow();
  const last30d = emptyWindow();

  for (const r of rows) {
    if (r.paymentType === "booking") continue;
    accumulate(last30d, r.paymentType, r.amountCents);
    if (r.createdAt >= start7) accumulate(last7d, r.paymentType, r.amountCents);
    if (r.createdAt >= dayStart) accumulate(today, r.paymentType, r.amountCents);
  }

  const [feeToday, fee7, fee30] = await Promise.all([
    sumBookingPlatformFees(dayStart, now),
    sumBookingPlatformFees(start7, now),
    sumBookingPlatformFees(start30, now),
  ]);

  today.bookingsCents += feeToday;
  today.totalCents += feeToday;
  last7d.bookingsCents += fee7;
  last7d.totalCents += fee7;
  last30d.bookingsCents += fee30;
  last30d.totalCents += fee30;

  return { today, last7d, last30d };
}
