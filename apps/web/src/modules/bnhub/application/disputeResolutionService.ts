import type { DisputeStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { addDisputeEvidence, createDispute } from "@/lib/bnhub/disputes";

export async function openDispute(params: Parameters<typeof createDispute>[0]) {
  return createDispute(params);
}

export async function submitEvidence(params: {
  disputeId: string;
  fileUrl: string;
  uploadedBy: string;
  type?: string | null;
  label?: string | null;
}) {
  return addDisputeEvidence({
    disputeId: params.disputeId,
    url: params.fileUrl,
    label: params.label ?? undefined,
    uploadedBy: params.uploadedBy,
    evidenceType: params.type ?? null,
  });
}

const RESOLVED_LIKE: DisputeStatus[] = [
  "RESOLVED",
  "RESOLVED_PARTIAL_REFUND",
  "RESOLVED_FULL_REFUND",
  "RESOLVED_RELOCATION",
  "REJECTED",
  "CLOSED",
];

/**
 * Admin resolution: updates dispute, logs resolution row, applies booking/payment flags for refunds & escrow.
 */
export async function resolveDispute(input: {
  disputeId: string;
  status: DisputeStatus;
  refundCents?: number;
  resolvedBy: string;
  resolutionNotes?: string;
}) {
  const dispute = await prisma.dispute.findUnique({
    where: { id: input.disputeId },
    include: { booking: { include: { payment: true } } },
  });
  if (!dispute) throw new Error("Dispute not found");

  const refund = Math.max(0, input.refundCents ?? 0);
  const pay = dispute.booking.payment;
  const fullRefund = pay && refund >= pay.amountCents;

  const resolutionType =
    input.status === "RESOLVED_PARTIAL_REFUND"
      ? "partial_refund"
      : input.status === "RESOLVED_FULL_REFUND"
        ? "full_refund"
        : input.status === "REJECTED"
          ? "no_action"
          : "no_action";

  return prisma.$transaction(async (tx) => {
    await tx.dispute.update({
      where: { id: input.disputeId },
      data: {
        status: input.status,
        refundCents: refund > 0 ? refund : dispute.refundCents,
        resolutionNotes: input.resolutionNotes,
        resolvedAt: RESOLVED_LIKE.includes(input.status) ? new Date() : undefined,
        resolvedBy: RESOLVED_LIKE.includes(input.status) ? input.resolvedBy : undefined,
      },
    });

    if (RESOLVED_LIKE.includes(input.status)) {
      await tx.disputeResolution.create({
        data: {
          disputeId: input.disputeId,
          resolutionType,
          refundCents: refund > 0 ? refund : undefined,
          notes: input.resolutionNotes,
          resolvedBy: input.resolvedBy,
        },
      });
    }

    if (refund > 0) {
      await tx.booking.update({
        where: { id: dispute.bookingId },
        data: { refunded: true, refundedAt: new Date() },
      });
      if (pay) {
        await tx.payment.update({
          where: { bookingId: dispute.bookingId },
          data: {
            payoutHoldReason: "dispute",
            status: fullRefund ? "REFUNDED" : "COMPLETED",
          },
        });
      }
    }

    if (
      input.status === "REJECTED" ||
      input.status === "RESOLVED_FULL_REFUND" ||
      input.status === "CLOSED"
    ) {
      await tx.payoutHold.updateMany({
        where: { bookingId: dispute.bookingId, status: "ON_HOLD" },
        data: { status: "RELEASED", releasedAt: new Date() },
      });
    }

    return tx.dispute.findUnique({ where: { id: input.disputeId } });
  });
}
