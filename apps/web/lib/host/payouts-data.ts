import { prisma } from "@/lib/db";

export type HostPayoutRow = {
  id: string;
  bookingId: string;
  confirmationCode: string | null;
  payoutStatus: string;
  grossAmountCents: number;
  platformFeeCents: number;
  netAmountCents: number;
  currency: string;
  eligibleReleaseAt: Date | null;
  releasedAt: Date | null;
  createdAt: Date;
};

export async function getHostPayouts(hostId: string, take = 80): Promise<HostPayoutRow[]> {
  const rows = await prisma.bnhubHostPayoutRecord.findMany({
    where: { hostUserId: hostId },
    orderBy: { createdAt: "desc" },
    take,
    include: {
      booking: { select: { confirmationCode: true } },
    },
  });

  return rows.map((r) => ({
    id: r.id,
    bookingId: r.bookingId,
    confirmationCode: r.booking.confirmationCode,
    payoutStatus: r.payoutStatus,
    grossAmountCents: r.grossAmountCents,
    platformFeeCents: r.platformFeeCents,
    netAmountCents: r.netAmountCents,
    currency: r.currency,
    eligibleReleaseAt: r.eligibleReleaseAt,
    releasedAt: r.releasedAt,
    createdAt: r.createdAt,
  }));
}

export async function getHostPayoutBalances(hostId: string) {
  const rows = await prisma.bnhubHostPayoutRecord.findMany({
    where: { hostUserId: hostId },
    select: { netAmountCents: true, payoutStatus: true },
  });
  let pendingCents = 0;
  let upcomingCents = 0;
  let paidOutCents = 0;
  for (const r of rows) {
    const s = r.payoutStatus;
    if (s === "PAID") paidOutCents += r.netAmountCents;
    else if (s === "SCHEDULED" || s === "IN_TRANSIT") upcomingCents += r.netAmountCents;
    else if (s === "PENDING" || s === "HELD") pendingCents += r.netAmountCents;
  }
  return { pendingCents, upcomingCents, paidOutCents };
}
