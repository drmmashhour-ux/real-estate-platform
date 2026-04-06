import { prisma } from "@/lib/db";
import { recomputeGuestTrustMetrics } from "@/lib/bnhub/two-sided-trust-sync";
import {
  computeHostGuestEvaluation,
  type HostGuestChecklist,
} from "@/lib/bnhub/stay-evaluation-ai";
import { isBookingPaymentVerified } from "./reviewService";

export type CreateHostReviewOfGuestInput = {
  guestRespectRating: number;
  propertyCareRating?: number;
  checkoutComplianceRating?: number;
  quietHoursRespected?: boolean;
  houseRulesRespected?: boolean;
  leftPropertyReasonablyTidy?: boolean;
  communicationReasonable?: boolean;
  theftOrDamageReported?: boolean;
  incidentDetails?: string;
  hostNotes?: string;
  hostChecklistJson?: Record<string, unknown>;
};

function assertRating(name: string, v: number | undefined, required: boolean) {
  if (v == null) {
    if (required) throw new Error(`${name} is required`);
    return;
  }
  if (!Number.isFinite(v) || v < 1 || v > 5) {
    throw new Error(`${name} must be between 1 and 5`);
  }
}

export async function createHostReviewOfGuest(
  bookingId: string,
  hostUserId: string,
  data: CreateHostReviewOfGuestInput
) {
  assertRating("guestRespectRating", data.guestRespectRating, true);
  assertRating("propertyCareRating", data.propertyCareRating, false);
  assertRating("checkoutComplianceRating", data.checkoutComplianceRating, false);

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      payment: { select: { status: true } },
      bnhubReservationPayment: { select: { paymentStatus: true } },
      listing: { select: { id: true, ownerId: true } },
    },
  });
  if (!booking) throw new Error("Booking not found");
  if (booking.listing.ownerId !== hostUserId) throw new Error("Only the listing host can evaluate this guest");
  if (booking.status !== "COMPLETED") throw new Error("You can only evaluate guests after the stay is completed");
  if (!isBookingPaymentVerified(booking)) throw new Error("Payment must be settled before host evaluation");

  const existing = await prisma.bnhubHostReviewOfGuest.findUnique({ where: { bookingId } });
  if (existing) throw new Error("You already submitted an evaluation for this stay");

  const incident = data.incidentDetails?.trim() ?? "";
  const notes = data.hostNotes?.trim() ?? "";
  if (incident.length > 8000) throw new Error("Incident details are too long");
  if (notes.length > 8000) throw new Error("Notes are too long");

  const checklist: HostGuestChecklist = {
    respectedQuietHours: data.quietHoursRespected,
    respectedHouseRules: data.houseRulesRespected,
    leftPropertyReasonablyTidy: data.leftPropertyReasonablyTidy,
    communicationReasonable: data.communicationReasonable,
  };

  const ai = await computeHostGuestEvaluation({
    guestRespectRating: data.guestRespectRating,
    propertyCareRating: data.propertyCareRating,
    checkoutComplianceRating: data.checkoutComplianceRating,
    theftOrDamageReported: Boolean(data.theftOrDamageReported),
    checklist,
    hostNotes: notes || undefined,
    incidentDetails: incident || undefined,
  });

  const mergedChecklist = {
    ...checklist,
    ...(data.hostChecklistJson && typeof data.hostChecklistJson === "object" ? data.hostChecklistJson : {}),
  };

  const row = await prisma.bnhubHostReviewOfGuest.create({
    data: {
      bookingId,
      hostId: hostUserId,
      guestId: booking.guestId,
      listingId: booking.listing.id,
      guestRespectRating: data.guestRespectRating,
      propertyCareRating: data.propertyCareRating,
      checkoutComplianceRating: data.checkoutComplianceRating,
      quietHoursRespected: data.quietHoursRespected,
      houseRulesRespected: data.houseRulesRespected,
      theftOrDamageReported: Boolean(data.theftOrDamageReported),
      incidentDetails: incident || undefined,
      hostNotes: notes || undefined,
      hostChecklistJson: Object.keys(mergedChecklist).length ? mergedChecklist : undefined,
      aiCompositeScore: ai.score,
      aiSummary: `[${ai.source}] ${ai.summary}`,
    },
  });
  void recomputeGuestTrustMetrics(booking.guestId).catch(() => {});
  return row;
}

export async function getHostReviewForBooking(bookingId: string) {
  return prisma.bnhubHostReviewOfGuest.findUnique({ where: { bookingId } });
}
