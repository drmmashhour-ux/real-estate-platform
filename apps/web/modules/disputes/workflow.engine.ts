import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import { DisputeStatus, DisputeClaimant } from "@prisma/client";

const TAG = "[dispute]";

export type ResolutionType = 
  | "refund_full" 
  | "refund_partial" 
  | "no_refund" 
  | "warning" 
  | "account_flag";

/**
 * Dispute Workflow Engine: Manages the lifecycle of a dispute.
 */
export async function openDispute(args: {
  bookingId: string;
  claimant: DisputeClaimant;
  claimantUserId: string;
  description: string;
  category?: string;
}) {
  const booking = await prisma.booking.findUnique({
    where: { id: args.bookingId },
    select: { listingId: true, hostId: true, guestId: true }
  });

  if (!booking) throw new Error("Booking not found");

  const dispute = await prisma.dispute.create({
    data: {
      bookingId: args.bookingId,
      listingId: booking.listingId,
      claimant: args.claimant,
      claimantUserId: args.claimantUserId,
      description: args.description,
      complaintCategory: args.category,
      status: "SUBMITTED",
    },
  });

  logInfo(`${TAG} created`, { disputeId: dispute.id, bookingId: args.bookingId });

  // Notify both parties
  // TODO: Trigger notifications
  
  return dispute;
}

/**
 * Add evidence to a dispute.
 */
export async function collectEvidence(disputeId: string, evidenceUrl: string, description?: string) {
  // @ts-ignore
  const evidence = await prisma.disputeEvidence.create({
    data: {
      disputeId,
      url: evidenceUrl,
      description,
    },
  });

  await prisma.dispute.update({
    where: { id: disputeId },
    data: { status: "EVIDENCE_REVIEW" },
  });

  logInfo(`${TAG} updated`, { disputeId, event: "evidence_added" });

  return evidence;
}

/**
 * Resolve a dispute with a specific resolution type.
 */
export async function resolveDispute(disputeId: string, args: {
  resolutionType: ResolutionType;
  refundCents?: number;
  notes?: string;
  resolvedBy: string;
}) {
  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
    select: { bookingId: true }
  });

  if (!dispute) throw new Error("Dispute not found");

  // Map ResolutionType to DisputeStatus (legacy/new alignment)
  let nextStatus: DisputeStatus = "RESOLVED";
  if (args.resolutionType === "refund_full") nextStatus = "RESOLVED_FULL_REFUND";
  if (args.resolutionType === "refund_partial") nextStatus = "RESOLVED_PARTIAL_REFUND";
  if (args.resolutionType === "no_refund") nextStatus = "REJECTED";

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.dispute.update({
      where: { id: disputeId },
      data: {
        status: nextStatus,
        resolutionOutcome: args.resolutionType,
        refundCents: args.refundCents,
        resolutionNotes: args.notes,
        resolvedAt: new Date(),
        resolvedBy: args.resolvedBy,
      },
    });

    await tx.disputeResolution.create({
      data: {
        disputeId,
        resolutionType: args.resolutionType,
        refundCents: args.refundCents,
        notes: args.notes,
        resolvedBy: args.resolvedBy,
      },
    });

    // If account flag/warning
    if (args.resolutionType === "account_flag" || args.resolutionType === "warning") {
      // Logic for flagging/warning
    }

    return updated;
  });

  logInfo(`${TAG} resolved`, { disputeId, resolution: args.resolutionType });

  // Notify parties of resolution
  // TODO: Trigger notifications

  return result;
}
