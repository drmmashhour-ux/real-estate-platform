import {
  BnhubMpPaymentEventActor,
  BnhubMpRefundStatus,
  BnhubMpRefundType,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { getMarketplacePaymentProcessor } from "@/modules/bnhub-payments/connectors/paymentProcessorFactory";
import { logRefundEvent } from "@/modules/bnhub-payments/services/financeAuditService";

export async function createRefundRequest(params: {
  bookingId: string;
  reservationPaymentId: string;
  guestUserId: string;
  hostUserId: string;
  refundType: BnhubMpRefundType;
  amountCents: number;
  currency: string;
  reasonCode: string;
  summary?: string;
  initiatedBy: string;
}) {
  return prisma.bnhubMarketplaceRefund.create({
    data: {
      bookingId: params.bookingId,
      reservationPaymentId: params.reservationPaymentId,
      guestUserId: params.guestUserId,
      hostUserId: params.hostUserId,
      refundType: params.refundType,
      amountCents: params.amountCents,
      currency: params.currency.toLowerCase(),
      refundStatus: BnhubMpRefundStatus.DRAFT,
      reasonCode: params.reasonCode,
      summary: params.summary,
      initiatedBy: params.initiatedBy,
    },
  });
}

export async function executeRefund(refundId: string): Promise<{ ok: true } | { error: string }> {
  const row = await prisma.bnhubMarketplaceRefund.findUnique({
    where: { id: refundId },
    include: { reservationPayment: true },
  });
  if (!row?.reservationPayment.processorPaymentIntentId) {
    return { error: "No processor payment intent" };
  }
  const processor = getMarketplacePaymentProcessor("stripe");
  const res = await processor.createRefund({
    paymentIntentId: row.reservationPayment.processorPaymentIntentId,
    amountCents: row.amountCents,
    idempotencyKey: `bnhub_refund_${refundId}`,
  });
  if ("error" in res) return { error: res.error };

  await prisma.bnhubMarketplaceRefund.update({
    where: { id: refundId },
    data: {
      refundStatus: BnhubMpRefundStatus.PENDING,
      processorRefundId: res.refundId,
    },
  });
  await logRefundEvent(refundId, row.bookingId, "refund_submitted_to_processor", {
    processorRefundId: res.refundId,
  });
  return { ok: true };
}

export async function syncRefundStatus(refundId: string, status: BnhubMpRefundStatus) {
  await prisma.bnhubMarketplaceRefund.update({
    where: { id: refundId },
    data: { refundStatus: status },
  });
}

export async function getRefundSummary(guestUserId: string, bookingId: string) {
  return prisma.bnhubMarketplaceRefund.findMany({
    where: { bookingId, guestUserId },
    orderBy: { createdAt: "desc" },
  });
}

export async function approveRefundIfPolicyAllows(
  refundId: string,
  _adminUserId: string
): Promise<{ ok: true } | { error: string }> {
  const row = await prisma.bnhubMarketplaceRefund.findUnique({ where: { id: refundId } });
  if (!row) return { error: "Not found" };
  if (row.refundStatus !== BnhubMpRefundStatus.DRAFT) return { error: "Invalid status" };
  await prisma.bnhubMarketplaceRefund.update({
    where: { id: refundId },
    data: { refundStatus: BnhubMpRefundStatus.PENDING },
  });
  await logRefundEvent(refundId, row.bookingId, "refund_approved", {}, BnhubMpPaymentEventActor.ADMIN, _adminUserId);
  return { ok: true };
}
