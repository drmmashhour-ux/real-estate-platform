/**
 * Short-Term Rental Service Dispute (BNHUB):
 * Guest submits complaint within 24h of check-in → freeze host payout → host response → resolution.
 */

import { prisma } from "@/lib/db";
import { DISPUTE_REPORT_WINDOW_HOURS, UNSAFE_COMPLAINT_CATEGORIES } from "./constants";
import type { ComplaintCategory, ResolutionOutcome } from "./constants";
import { createPayoutHold, releasePayoutHoldsForBooking, markHoldsRefundedForBooking } from "./payout-hold-service";

const RESOLVED_STATUSES = [
  "RESOLVED",
  "RESOLVED_PARTIAL_REFUND",
  "RESOLVED_FULL_REFUND",
  "RESOLVED_RELOCATION",
  "REJECTED",
  "CLOSED",
] as const;

function urgencyFromCategory(category: ComplaintCategory | string): "normal" | "high" | "urgent" {
  if (UNSAFE_COMPLAINT_CATEGORIES.includes(category as (typeof UNSAFE_COMPLAINT_CATEGORIES)[number])) return "urgent";
  if (category === "property_not_as_described" || category === "misleading_photos") return "high";
  return "normal";
}

function resolutionToDisputeStatus(outcome: ResolutionOutcome): "RESOLVED" | "RESOLVED_PARTIAL_REFUND" | "RESOLVED_FULL_REFUND" | "RESOLVED_RELOCATION" | "REJECTED" | "CLOSED" {
  switch (outcome) {
    case "partial_refund": return "RESOLVED_PARTIAL_REFUND";
    case "full_refund": return "RESOLVED_FULL_REFUND";
    case "guest_relocation": return "RESOLVED_RELOCATION";
    case "no_action": return "REJECTED";
    case "cancel_booking": return "RESOLVED_FULL_REFUND";
    case "host_suspended": case "host_warning": return "RESOLVED";
    default: return "RESOLVED";
  }
}

export interface SubmitComplaintInput {
  bookingId: string;
  claimantUserId: string;
  description: string;
  complaintCategory: ComplaintCategory;
  evidenceUrls?: string[];
  urgencyLevel?: "normal" | "high" | "urgent";
}

/** Step 1: Guest submits complaint. Validates within 24h of check-in. Unsafe conditions get urgent priority. */
export async function submitComplaint(input: SubmitComplaintInput): Promise<{ disputeId: string; payoutFrozen: boolean }> {
  const booking = await prisma.booking.findUnique({
    where: { id: input.bookingId },
    include: { listing: { select: { id: true, ownerId: true } }, payment: true },
  });
  if (!booking) throw new Error("Booking not found");
  if (booking.guestId !== input.claimantUserId) throw new Error("Only the guest can submit a complaint for this booking");
  if (booking.status !== "CONFIRMED" && booking.status !== "COMPLETED") throw new Error("Complaint only for confirmed or completed bookings");

  const checkIn = new Date(booking.checkIn);
  const now = new Date();
  const hoursSinceCheckIn = (now.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
  if (hoursSinceCheckIn > DISPUTE_REPORT_WINDOW_HOURS) {
    throw new Error(`Complaint must be submitted within ${DISPUTE_REPORT_WINDOW_HOURS} hours of check-in`);
  }

  const existing = await prisma.dispute.findFirst({
    where: { bookingId: input.bookingId, claimant: "GUEST" },
    select: { id: true },
  });
  if (existing) throw new Error("A complaint already exists for this booking");

  const urgency = input.urgencyLevel ?? urgencyFromCategory(input.complaintCategory);
  const payoutReason = urgency === "urgent" ? "safety_complaint" : "dispute";

  const dispute = await prisma.dispute.create({
    data: {
      bookingId: input.bookingId,
      listingId: booking.listingId,
      claimant: "GUEST",
      claimantUserId: input.claimantUserId,
      description: input.description,
      complaintCategory: input.complaintCategory,
      evidenceUrls: input.evidenceUrls ?? [],
      status: "SUBMITTED",
      urgencyLevel: urgency,
      hostPayoutFrozenAt: now,
    },
  });

  let payoutFrozen = false;
  if (booking.payment) {
    await prisma.payment.update({
      where: { id: booking.payment.id },
      data: {
        payoutHoldReason: payoutReason,
        hostPayoutReleasedAt: null,
      },
    });
    await createPayoutHold({
      bookingId: input.bookingId,
      hostId: booking.listing.ownerId,
      reason: payoutReason,
    });
    payoutFrozen = true;
  }

  return { disputeId: dispute.id, payoutFrozen };
}

/** Host responds to dispute. Sets hostRespondedAt and moves to UNDER_REVIEW. */
export async function hostRespondToDispute(disputeId: string, hostId: string, message: string): Promise<void> {
  const dispute = await prisma.dispute.findUniqueOrThrow({
    where: { id: disputeId },
    include: { listing: { select: { ownerId: true } } },
  });
  if (dispute.listing.ownerId !== hostId) throw new Error("Only the host can respond");
  if (RESOLVED_STATUSES.includes(dispute.status as (typeof RESOLVED_STATUSES)[number])) {
    throw new Error("Dispute already resolved");
  }

  const now = new Date();
  await prisma.$transaction([
    prisma.disputeMessage.create({
      data: { disputeId, senderId: hostId, body: message, isInternal: false },
    }),
    prisma.dispute.update({
      where: { id: disputeId },
      data: { hostRespondedAt: now, status: "UNDER_REVIEW" },
    }),
  ]);
}

export interface ResolveDisputeInput {
  disputeId: string;
  resolvedBy: string;
  resolutionOutcome: ResolutionOutcome;
  refundCents?: number | null;
  resolutionNotes?: string | null;
}

/** Step 4: Platform resolution. Creates DisputeResolution audit record and sets dispute status. */
export async function resolveDispute(input: ResolveDisputeInput): Promise<void> {
  const dispute = await prisma.dispute.findUnique({
    where: { id: input.disputeId },
    include: { booking: { include: { payment: true } }, listing: { select: { ownerId: true } } },
  });
  if (!dispute) throw new Error("Dispute not found");
  if (RESOLVED_STATUSES.includes(dispute.status as (typeof RESOLVED_STATUSES)[number])) {
    throw new Error("Dispute already resolved");
  }

  const now = new Date();
  const newStatus = resolutionToDisputeStatus(input.resolutionOutcome);
  const refundCents = input.refundCents ?? undefined;

  await prisma.disputeResolution.create({
    data: {
      disputeId: input.disputeId,
      resolutionType: input.resolutionOutcome,
      refundCents: refundCents ?? null,
      notes: input.resolutionNotes ?? undefined,
      resolvedBy: input.resolvedBy,
      resolvedAt: now,
    },
  });

  await prisma.dispute.update({
    where: { id: input.disputeId },
    data: {
      status: newStatus,
      resolutionOutcome: input.resolutionOutcome,
      refundCents,
      resolutionNotes: input.resolutionNotes ?? undefined,
      resolvedAt: now,
      resolvedBy: input.resolvedBy,
    },
  });

  if (input.resolutionOutcome === "full_refund" || input.resolutionOutcome === "partial_refund") {
    if (dispute.booking.payment && input.refundCents != null && input.refundCents > 0) {
      await prisma.payment.update({
        where: { id: dispute.booking.payment.id },
        data: {
          payoutHoldReason: null,
          hostPayoutReleasedAt: null,
          status: "REFUNDED",
        },
      });
      await markHoldsRefundedForBooking(dispute.bookingId);
    }
  }

  if (input.resolutionOutcome === "host_suspended") {
    await prisma.shortTermListing.updateMany({
      where: { ownerId: dispute.listing.ownerId },
      data: { listingStatus: "SUSPENDED" },
    });
    const { restrictUser } = await import("./fraud-response");
    await restrictUser(dispute.listing.ownerId);
    await prisma.hostAccountWarning.create({
      data: {
        userId: dispute.listing.ownerId,
        warningType: "complaint_pattern",
        message: "Account restricted and listings suspended following dispute resolution (serious service quality / fraud).",
        severity: "suspension",
        createdBy: input.resolvedBy,
      },
    });
    await prisma.hostRiskHistory.create({
      data: {
        hostId: dispute.listing.ownerId,
        riskType: "complaints",
        riskScore: 1,
        notes: `Dispute ${input.disputeId} resolved with host_suspended.`,
        createdAt: new Date(),
      },
    });
  }

  const refundOutcomes = ["full_refund", "partial_refund"];
  if (
    input.resolutionOutcome !== "host_suspended" &&
    !refundOutcomes.includes(input.resolutionOutcome) &&
    dispute.booking.payment?.payoutHoldReason
  ) {
    const releaseAt = new Date(dispute.booking.checkIn);
    releaseAt.setHours(releaseAt.getHours() + 48);
    await prisma.payment.update({
      where: { id: dispute.booking.payment.id },
      data: {
        payoutHoldReason: null,
        hostPayoutReleasedAt: releaseAt,
      },
    });
    await releasePayoutHoldsForBooking(dispute.bookingId);
  }
}
