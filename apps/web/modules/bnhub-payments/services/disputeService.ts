import {
  BnhubMpDisputeStatus,
  BnhubMpHoldStatus,
  BnhubMpHoldType,
  BnhubMpPaymentEventActor,
  BnhubMpPayoutStatus,
  BnhubMpRiskHold,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { getMarketplacePaymentProcessor } from "@/modules/bnhub-payments/connectors/paymentProcessorFactory";
import { logDisputeEvent } from "@/modules/bnhub-payments/services/financeAuditService";

export async function ingestDisputeEvent(params: {
  reservationPaymentId: string;
  bookingId: string;
  processorDisputeId: string;
  amountCents: number;
  currency: string;
  status?: BnhubMpDisputeStatus;
}) {
  const existing = await prisma.bnhubMarketplaceDispute.findUnique({
    where: { processorDisputeId: params.processorDisputeId },
  });
  if (existing) return existing;

  const d = await prisma.bnhubMarketplaceDispute.create({
    data: {
      reservationPaymentId: params.reservationPaymentId,
      bookingId: params.bookingId,
      processorDisputeId: params.processorDisputeId,
      disputeStatus: params.status ?? BnhubMpDisputeStatus.OPEN,
      amountCents: params.amountCents,
      currency: params.currency.toLowerCase(),
    },
  });
  await lockPayoutsForDisputedPayment(params.reservationPaymentId);
  await logDisputeEvent(d.id, params.bookingId, "dispute_opened", {
    processorDisputeId: params.processorDisputeId,
  });
  return d;
}

export async function openDisputeCase(params: {
  reservationPaymentId: string;
  bookingId: string;
  amountCents: number;
  currency: string;
  summary: string;
}) {
  const d = await prisma.bnhubMarketplaceDispute.create({
    data: {
      reservationPaymentId: params.reservationPaymentId,
      bookingId: params.bookingId,
      disputeStatus: BnhubMpDisputeStatus.OPEN,
      amountCents: params.amountCents,
      currency: params.currency.toLowerCase(),
      summary: params.summary,
    },
  });
  await lockPayoutsForDisputedPayment(params.reservationPaymentId);
  await logDisputeEvent(d.id, params.bookingId, "dispute_case_opened_internal", {});
  return d;
}

export async function updateDisputeStatus(disputeId: string, status: BnhubMpDisputeStatus) {
  const row = await prisma.bnhubMarketplaceDispute.update({
    where: { id: disputeId },
    data: { disputeStatus: status },
  });
  await logDisputeEvent(disputeId, row.bookingId, "dispute_status_updated", { status });
}

export async function buildEvidencePacket(disputeId: string) {
  const d = await prisma.bnhubMarketplaceDispute.findUnique({ where: { id: disputeId } });
  return { disputeId, evidencePlaceholder: true, internalNotes: d?.evidenceJson };
}

export async function submitEvidencePlaceholder(disputeId: string) {
  await updateDisputeStatus(disputeId, BnhubMpDisputeStatus.UNDER_REVIEW);
}

export async function lockPayoutsForDisputedPayment(reservationPaymentId: string) {
  const pay = await prisma.bnhubReservationPayment.findUnique({
    where: { id: reservationPaymentId },
    select: { bookingId: true, id: true, currency: true, amountCapturedCents: true },
  });
  if (!pay) return;

  await prisma.bnhubHostPayoutRecord.updateMany({
    where: { reservationPaymentId },
    data: { payoutStatus: "HELD", releaseReason: "dispute_active" },
  });

  await prisma.bnhubPaymentHold.create({
    data: {
      bookingId: pay.bookingId,
      reservationPaymentId: pay.id,
      holdType: BnhubMpHoldType.DISPUTE_HOLD,
      holdStatus: BnhubMpHoldStatus.ACTIVE,
      amountCents: pay.amountCapturedCents,
      currency: pay.currency,
      reason: "Chargeback or dispute — payout release paused (payout control, not legal escrow).",
    },
  });

  await prisma.bnhubReservationPayment.update({
    where: { id: reservationPaymentId },
    data: { riskHoldStatus: BnhubMpRiskHold.RELEASE_BLOCKED },
  });
}

export async function getDisputeFromProcessor(disputeId: string) {
  const processor = getMarketplacePaymentProcessor("stripe");
  return processor.getDisputeStatus(disputeId);
}
