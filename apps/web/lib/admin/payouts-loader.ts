import type { BnhubMpPayoutStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

export type AdminPayoutSummary = {
  pendingCents: number;
  processingCents: number;
  sentThisMonthCents: number;
  /** Sum of net amounts ever marked PAID */
  completedLifetimeCents: number;
  failedCount: number;
  avgDaysToPaid: number | null;
};

export type AdminPayoutRow = {
  id: string;
  hostEmail: string | null;
  hostName: string | null;
  bookingRef: string | null;
  grossCents: number;
  feeCents: number;
  netCents: number;
  status: string;
  createdAt: Date;
  releasedAt: Date | null;
};

export async function getAdminPayoutSummary(): Promise<AdminPayoutSummary> {
  const som = new Date();
  som.setDate(1);
  som.setHours(0, 0, 0, 0);

  const rows = await prisma.bnhubHostPayoutRecord.findMany({
    select: {
      netAmountCents: true,
      payoutStatus: true,
      releasedAt: true,
      createdAt: true,
    },
  });

  let pendingCents = 0;
  let processingCents = 0;
  let sentThisMonthCents = 0;
  let completedLifetimeCents = 0;
  let failedCount = 0;
  const paidDeltas: number[] = [];

  for (const r of rows) {
    const s = r.payoutStatus;
    if (s === "PENDING" || s === "HELD") pendingCents += r.netAmountCents;
    else if (s === "SCHEDULED" || s === "IN_TRANSIT") processingCents += r.netAmountCents;
    else if (s === "PAID") {
      completedLifetimeCents += r.netAmountCents;
      if (r.releasedAt && r.releasedAt >= som) sentThisMonthCents += r.netAmountCents;
      if (r.releasedAt) {
        paidDeltas.push((r.releasedAt.getTime() - r.createdAt.getTime()) / 86400000);
      }
    } else if (s === "FAILED") failedCount += 1;
  }

  const avgDaysToPaid =
    paidDeltas.length > 0 ? paidDeltas.reduce((a, b) => a + b, 0) / paidDeltas.length : null;

  return {
    pendingCents,
    processingCents,
    sentThisMonthCents,
    completedLifetimeCents,
    failedCount,
    avgDaysToPaid,
  };
}

export type AdminPayoutFilters = {
  status?: string;
};

export async function getAdminPayouts(
  filters: AdminPayoutFilters = {},
  take = 200
): Promise<AdminPayoutRow[]> {
  return getAdminPayoutRowsFiltered(filters, take);
}

async function getAdminPayoutRowsFiltered(filters: AdminPayoutFilters, take: number): Promise<AdminPayoutRow[]> {
  const rows = await prisma.bnhubHostPayoutRecord.findMany({
    where: filters.status?.trim() ? { payoutStatus: filters.status.trim() as never } : undefined,
    orderBy: { createdAt: "desc" },
    take,
    include: {
      host: { select: { name: true, email: true } },
      booking: { select: { confirmationCode: true } },
    },
  });

  return rows.map((r) => ({
    id: r.id,
    hostEmail: r.host.email,
    hostName: r.host.name,
    bookingRef: r.booking.confirmationCode,
    grossCents: r.grossAmountCents,
    feeCents: r.platformFeeCents,
    netCents: r.netAmountCents,
    status: r.payoutStatus,
    createdAt: r.createdAt,
    releasedAt: r.releasedAt,
  }));
}

export async function getAdminPayoutRows(take = 200): Promise<AdminPayoutRow[]> {
  return getAdminPayoutRowsFiltered({}, take);
}
