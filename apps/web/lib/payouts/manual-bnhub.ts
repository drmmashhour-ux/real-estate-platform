import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import { persistMoneyEvent } from "@/lib/payments/money-events";

export type BnhubManualPayoutExportRow = {
  id: string;
  bookingId: string;
  hostUserId: string;
  amountCents: number;
  currency: string;
  status: string;
  queueReason: string | null;
  beneficiaryName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  referenceNote: string | null;
  processedByUserId: string | null;
  processedAt: Date | null;
  createdAt: Date;
};

/**
 * Idempotent: one manual row per booking. Never creates Stripe transfers.
 */
export async function queueBnhubManualHostPayout(input: {
  bookingId: string;
  hostUserId: string;
  amountCents: number;
  queueReason: string;
}): Promise<string> {
  const existing = await prisma.bnhubManualHostPayout.findUnique({
    where: { bookingId: input.bookingId },
    select: { id: true, status: true },
  });
  if (existing?.status === "paid") {
    return existing.id;
  }

  const row = await prisma.bnhubManualHostPayout.upsert({
    where: { bookingId: input.bookingId },
    create: {
      bookingId: input.bookingId,
      hostUserId: input.hostUserId,
      amountCents: input.amountCents,
      status: "queued",
      queueReason: input.queueReason,
    },
    update: {
      amountCents: input.amountCents,
      status: "queued",
      queueReason: input.queueReason,
      processedAt: null,
      processedByUserId: null,
    },
  });
  logInfo("[bnhub-manual-payout] queued", { id: row.id, bookingId: input.bookingId, reason: input.queueReason });
  await persistMoneyEvent({
    type: "host_payout_manual",
    bookingId: input.bookingId,
    hostUserId: input.hostUserId,
    amountCents: input.amountCents,
    metadata: { queueReason: input.queueReason, manualPayoutId: row.id },
  });
  return row.id;
}

export async function markBnhubManualPayoutPaid(input: {
  manualPayoutId: string;
  processedByUserId: string;
  referenceNote?: string | null;
  beneficiaryName?: string | null;
}): Promise<void> {
  await prisma.bnhubManualHostPayout.update({
    where: { id: input.manualPayoutId },
    data: {
      status: "paid",
      processedByUserId: input.processedByUserId,
      processedAt: new Date(),
      referenceNote: input.referenceNote ?? undefined,
      beneficiaryName: input.beneficiaryName ?? undefined,
    },
  });
  const row = await prisma.bnhubManualHostPayout.findUnique({
    where: { id: input.manualPayoutId },
    select: { bookingId: true, hostUserId: true, amountCents: true },
  });
  if (row) {
    await persistMoneyEvent({
      type: "host_payout_sent",
      bookingId: row.bookingId,
      hostUserId: row.hostUserId,
      amountCents: row.amountCents,
      metadata: { channel: "manual_admin", manualPayoutId: input.manualPayoutId },
    });
  }
}

export async function exportManualPayoutQueue(
  status: "queued" | "paid" | "cancelled" = "queued"
): Promise<BnhubManualPayoutExportRow[]> {
  return prisma.bnhubManualHostPayout.findMany({
    where: { status },
    orderBy: { createdAt: "asc" },
  });
}
