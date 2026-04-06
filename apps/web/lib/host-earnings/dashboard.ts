import { PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

export interface HostEarningsSnapshot {
  grossEarningsCents: number;
  pendingPayoutsCents: number;
  paidOutCents: number;
  nextPayoutAt: string | null;
  currency: "cad";
  recentPayouts: Array<{
    bookingId: string;
    amountCents: number;
    status: string;
    availableAt: string | null;
    paidAt: string | null;
  }>;
  manualQueuedCents: number;
  bookings: Array<{
    bookingId: string;
    listingTitle: string;
    totalChargeCents: number;
    platformFeeCents: number | null;
    hostPayoutCents: number | null;
    paymentStatus: string;
    payoutRowStatus: string | null;
    manualPayoutStatus: string | null;
  }>;
}

export async function buildHostEarningsSnapshot(hostUserId: string): Promise<HostEarningsSnapshot> {
  const listingIds = await prisma.shortTermListing.findMany({
    where: { ownerId: hostUserId },
    select: { id: true },
  });
  const ids = listingIds.map((l) => l.id);
  if (ids.length === 0) {
    return {
      grossEarningsCents: 0,
      pendingPayoutsCents: 0,
      paidOutCents: 0,
      nextPayoutAt: null,
      currency: "cad",
      recentPayouts: [],
      manualQueuedCents: 0,
      bookings: [],
    };
  }

  const bookings = await prisma.booking.findMany({
    where: { listingId: { in: ids } },
    select: {
      id: true,
      listing: { select: { title: true } },
      payment: {
        select: {
          amountCents: true,
          platformFeeCents: true,
          hostPayoutCents: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  const bookingIds = bookings.map((b) => b.id);
  const orchForBookings = await prisma.orchestratedPayout.findMany({
    where: { bookingId: { in: bookingIds } },
    select: { bookingId: true, status: true },
  });
  const payoutStatusByBooking = new Map<string, string>();
  for (const o of orchForBookings) {
    if (o.bookingId) payoutStatusByBooking.set(o.bookingId, o.status);
  }

  const manualForBookings = await prisma.bnhubManualHostPayout.findMany({
    where: { bookingId: { in: bookingIds } },
    select: { bookingId: true, status: true },
  });
  const manualStatusByBooking = new Map<string, string>();
  for (const m of manualForBookings) {
    manualStatusByBooking.set(m.bookingId, m.status);
  }

  let grossEarningsCents = 0;
  const bookingRows: HostEarningsSnapshot["bookings"] = [];
  for (const b of bookings) {
    if (b.payment?.status === PaymentStatus.COMPLETED) {
      const hostNet = b.payment.hostPayoutCents ?? 0;
      const platform = b.payment.platformFeeCents ?? 0;
      grossEarningsCents += hostNet + platform;
    }
    bookingRows.push({
      bookingId: b.id,
      listingTitle: b.listing.title ?? "Listing",
      totalChargeCents: b.payment?.amountCents ?? 0,
      platformFeeCents: b.payment?.platformFeeCents ?? null,
      hostPayoutCents: b.payment?.hostPayoutCents ?? null,
      paymentStatus: b.payment?.status ?? "unknown",
      payoutRowStatus: payoutStatusByBooking.get(b.id) ?? null,
      manualPayoutStatus: manualStatusByBooking.get(b.id) ?? null,
    });
  }

  const orchRows = await prisma.orchestratedPayout.findMany({
    where: { hostId: hostUserId },
    orderBy: { scheduledAt: "desc" },
    take: 20,
    select: {
      bookingId: true,
      amountCents: true,
      status: true,
      availableAt: true,
      paidAt: true,
      scheduledAt: true,
    },
  });

  let pendingPayoutsCents = 0;
  let paidOutCents = 0;
  let nextPayoutAt: Date | null = null;
  for (const r of orchRows) {
    if (r.status === "scheduled") {
      pendingPayoutsCents += r.amountCents;
      const due = r.availableAt ?? r.scheduledAt;
      if (due) {
        if (!nextPayoutAt || due < nextPayoutAt) nextPayoutAt = due;
      }
    }
    if (r.status === "sent") {
      paidOutCents += r.amountCents;
    }
  }

  const manual = await prisma.bnhubManualHostPayout.aggregate({
    where: { hostUserId, status: "queued" },
    _sum: { amountCents: true },
  });
  const manualQueuedCents = manual._sum.amountCents ?? 0;

  const manualPaid = await prisma.bnhubManualHostPayout.aggregate({
    where: { hostUserId, status: "paid" },
    _sum: { amountCents: true },
  });
  paidOutCents += manualPaid._sum.amountCents ?? 0;

  return {
    grossEarningsCents,
    pendingPayoutsCents,
    paidOutCents,
    nextPayoutAt: nextPayoutAt ? nextPayoutAt.toISOString() : null,
    currency: "cad",
    recentPayouts: orchRows
      .filter((r) => r.bookingId)
      .map((r) => ({
        bookingId: r.bookingId as string,
        amountCents: r.amountCents,
        status: r.status,
        availableAt: r.availableAt ? r.availableAt.toISOString() : null,
        paidAt: r.paidAt ? r.paidAt.toISOString() : null,
      })),
    manualQueuedCents,
    bookings: bookingRows,
  };
}
