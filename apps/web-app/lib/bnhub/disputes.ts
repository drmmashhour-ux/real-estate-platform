import { prisma } from "@/lib/db";
import type { DisputeStatus } from "@prisma/client";

export async function createDispute(data: {
  bookingId: string;
  claimant: "GUEST" | "HOST";
  claimantUserId: string;
  description: string;
  evidenceUrls?: string[];
}) {
  const booking = await prisma.booking.findUniqueOrThrow({
    where: { id: data.bookingId },
    select: { listingId: true },
  });
  return prisma.dispute.create({
    data: {
      bookingId: data.bookingId,
      listingId: booking.listingId,
      claimant: data.claimant,
      claimantUserId: data.claimantUserId,
      description: data.description,
      evidenceUrls: data.evidenceUrls ?? [],
    },
  });
}

export async function getDisputesForBooking(bookingId: string) {
  return prisma.dispute.findMany({
    where: { bookingId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getDisputesByStatus(status: "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "CLOSED") {
  return prisma.dispute.findMany({
    where: { status },
    include: {
      booking: {
        select: {
          id: true,
          checkIn: true,
          checkOut: true,
          guest: { select: { id: true, name: true, email: true } },
          listing: { select: { id: true, title: true, ownerId: true } },
        },
      },
      listing: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAllDisputes() {
  return prisma.dispute.findMany({
    include: {
      booking: {
        select: {
          id: true,
          checkIn: true,
          checkOut: true,
          guest: { select: { name: true, email: true } },
          listing: { select: { title: true } },
        },
      },
      listing: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

const RESOLVED_LIKE: DisputeStatus[] = ["RESOLVED", "RESOLVED_PARTIAL_REFUND", "RESOLVED_FULL_REFUND", "RESOLVED_RELOCATION", "REJECTED", "CLOSED"];

export async function updateDisputeStatus(
  disputeId: string,
  status: DisputeStatus,
  resolutionNotes?: string,
  resolvedBy?: string
) {
  return prisma.dispute.update({
    where: { id: disputeId },
    data: {
      status,
      resolutionNotes,
      resolvedAt: RESOLVED_LIKE.includes(status) ? new Date() : undefined,
      resolvedBy,
    },
  });
}

/** Add a message to the dispute thread (guest, host, or support). */
export async function addDisputeMessage(params: {
  disputeId: string;
  senderId: string;
  body: string;
  isInternal?: boolean;
}) {
  return prisma.disputeMessage.create({
    data: {
      disputeId: params.disputeId,
      senderId: params.senderId,
      body: params.body,
      isInternal: params.isInternal ?? false,
    },
  });
}

/** Get message thread for a dispute (exclude internal unless admin). */
export async function getDisputeMessages(disputeId: string, includeInternal = false) {
  return prisma.disputeMessage.findMany({
    where: {
      disputeId,
      ...(includeInternal ? {} : { isInternal: false }),
    },
    orderBy: { createdAt: "asc" },
  });
}

/** Add evidence item to dispute (e.g. after file upload). */
export async function addDisputeEvidence(params: {
  disputeId: string;
  url: string;
  label?: string;
  uploadedBy: string;
}) {
  return prisma.disputeEvidence.create({
    data: {
      disputeId: params.disputeId,
      url: params.url,
      label: params.label,
      uploadedBy: params.uploadedBy,
    },
  });
}

/** Get all evidence for a dispute. */
export async function getDisputeEvidence(disputeId: string) {
  return prisma.disputeEvidence.findMany({
    where: { disputeId },
    orderBy: { createdAt: "asc" },
  });
}
