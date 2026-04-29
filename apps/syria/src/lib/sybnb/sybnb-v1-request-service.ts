import { prisma } from "@/lib/db";
import type { SybnbBooking, SyriaProperty, SyriaAppUser, SyriaUserRole } from "@/generated/prisma";
import { evaluateSybnbStayRequestEligibility } from "@/lib/sybnb/sybnb-booking-rules";
import { countReportsForProperty } from "@/lib/sy8/sy8-report-threshold";
import { countUnreviewedSybnbReportsForProperty } from "@/lib/sybnb/sybnb-reports";
import { isSy8SellerVerified } from "@/lib/sy8/sy8-reputation";
import { computeSybnbV1BookingRiskScore, sybnbRiskStateFromScore } from "@/lib/sybnb/sybnb-v1-booking-risk";
import { recordSybnbEvent, SYBNB_ANALYTICS_EVENT_TYPES } from "@/lib/sybnb/sybnb-analytics-events";
import { SYBNB_SIM_ESCROW_PENDING } from "@/lib/sybnb/sybnb-simulated-escrow";
import { updateFraudScore } from "@/lib/sybnb/fraud-score";
import { adjustTrustScore } from "@/lib/sybnb/trust-score";
import { logTimelineEvent } from "@/lib/timeline/log-event";

function parseStayDate(s: string): Date | null {
  const t = s.trim();
  if (!t) return null;
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function stayNights(checkIn: Date, checkOut: Date): number {
  const a = new Date(checkIn);
  a.setUTCHours(0, 0, 0, 0);
  const b = new Date(checkOut);
  b.setUTCHours(0, 0, 0, 0);
  const ms = b.getTime() - a.getTime();
  return Math.round(ms / 86400000);
}

function nightlyFromListing(p: Pick<SyriaProperty, "pricePerNight" | "price">): number {
  if (p.pricePerNight != null && p.pricePerNight > 0) return p.pricePerNight;
  return Math.max(0, Math.floor(Number(p.price)));
}

export type CreateSybnbV1RequestResult =
  | { ok: true; booking: SybnbBooking }
  | {
      ok: false;
      code:
        | "unauthorized"
        | "not_found"
        | "not_stay"
        | "bad_dates"
        | "own_listing"
        | "blocked"
        | "validation"
        | "restricted";
      message?: string;
    };

/**
 * SYBNB-1: create a `SybnbBooking` (no card or wallet payment).
 * Gates match guest-facing browse + {@link evaluateSybnbStayRequestEligibility} (approved stay, published, TRUST bars, location, unreviewed-report threshold, optional host verification).
 * `nights` = UTC-midnight calendar diff; `totalAmount = nights * nightlyRate` with nightlyRate = `pricePerNight` if set, else `floor(price)` (see `listing.price` on stay rows).
 * Row: `status: requested`, `paymentStatus: none`, `hostId: listing.ownerId` (seller).
 */
export async function createSybnbV1Request(input: {
  guestId: string;
  listingId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
}): Promise<CreateSybnbV1RequestResult> {
  const listing = await prisma.syriaProperty.findUnique({
    where: { id: input.listingId.trim() },
    include: { owner: true },
  });
  if (!listing) {
    return { ok: false, code: "not_found" };
  }
  if (listing.ownerId === input.guestId) {
    return { ok: false, code: "own_listing" };
  }

  const unreviewed = await countUnreviewedSybnbReportsForProperty(listing.id);
  const elig = evaluateSybnbStayRequestEligibility(listing, listing.owner, {
    unreviewedReportCount: unreviewed,
  });
  if (!elig.ok) {
    if (elig.code === "not_stay") {
      return { ok: false, code: "not_stay" };
    }
    return { ok: false, code: "blocked" };
  }

  const checkIn = parseStayDate(input.checkIn);
  const checkOut = parseStayDate(input.checkOut);
  if (!checkIn || !checkOut) {
    return { ok: false, code: "bad_dates" };
  }
  const nights = stayNights(checkIn, checkOut);
  if (nights < 1) {
    return { ok: false, code: "bad_dates" };
  }
  const g = Math.max(1, Math.floor(Number(input.guests) || 1));
  if (listing.guestsMax != null && g > listing.guestsMax) {
    return { ok: false, code: "validation" };
  }

  const nightlyPrice = nightlyFromListing(listing);
  if (nightlyPrice <= 0) {
    return { ok: false, code: "validation" };
  }
  const totalAmount = nights * nightlyPrice;

  const listingReportCount = await countReportsForProperty(listing.id);
  const riskScore = computeSybnbV1BookingRiskScore({
    host: listing.owner,
    listing,
    listingReportCount,
  });
  let riskStatus = sybnbRiskStateFromScore(riskScore);
  // SY8-1: host not verified → `review` (still bookable; higher SY8-2 risk can stay `blocked`).
  if (!isSy8SellerVerified(listing.owner) && riskStatus === "clear") {
    riskStatus = "review";
  }

  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentBookingRequests = await prisma.sybnbBooking.count({
    where: { guestId: input.guestId, createdAt: { gte: hourAgo } },
  });
  if (recentBookingRequests >= 2) {
    await updateFraudScore(input.guestId, "rapid_booking_requests");
  }

  const booking = await prisma.sybnbBooking.create({
    data: {
      listingId: listing.id,
      guestId: input.guestId,
      hostId: listing.ownerId,
      checkIn,
      checkOut,
      guests: g,
      nightlyPrice,
      nights,
      serviceFee: 0,
      totalAmount,
      currency: listing.currency ?? "SYP",
      status: "requested",
      paymentStatus: "none",
      riskScore,
      riskStatus,
      isTest: listing.isTest,
    },
  });

  console.log("[SYBNB] booking created", {
    bookingId: booking.id,
    listingId: listing.id,
    guestId: input.guestId,
    hostId: listing.ownerId,
  });

  void recordSybnbEvent({
    type: SYBNB_ANALYTICS_EVENT_TYPES.BOOKING_REQUEST,
    listingId: listing.id,
    userId: input.guestId,
    metadata: { bookingId: booking.id },
  });

  void logTimelineEvent({
    entityType: "sybnb_booking",
    entityId: booking.id,
    action: "sybnb_booking_requested",
    actorId: input.guestId,
    actorRole: "guest",
    metadata: { listingId: listing.id, nights, riskStatus },
  });
  if (riskStatus !== "clear") {
    void logTimelineEvent({
      entityType: "sybnb_booking",
      entityId: booking.id,
      action: "sybnb_risk_signal_detected",
      actorId: input.guestId,
      actorRole: "guest",
      metadata: { riskStatus, riskScore },
    });
  }

  return { ok: true, booking };
}

export type HostActionResult = { ok: true; booking: SybnbBooking } | { ok: false; code: "unauthorized" | "not_found" | "forbidden" | "bad_state" };

export async function hostApproveSybnbV1Request(input: { userId: string; userRole: SyriaUserRole; bookingId: string }): Promise<HostActionResult> {
  const b = await prisma.sybnbBooking.findUnique({ where: { id: input.bookingId.trim() } });
  if (!b) {
    return { ok: false, code: "not_found" };
  }
  const isHost = b.hostId === input.userId;
  const isAdmin = input.userRole === "ADMIN";
  if (!isHost && !isAdmin) {
    return { ok: false, code: "forbidden" };
  }
  if (b.status !== "requested") {
    return { ok: false, code: "bad_state" };
  }
  const updated = await prisma.sybnbBooking.update({
    where: { id: b.id },
    data: {
      status: "approved",
      paymentStatus: "manual_required",
      approvedAt: new Date(),
      sybnbSimulatedEscrowStatus: SYBNB_SIM_ESCROW_PENDING,
    },
  });

  void updateFraudScore(b.guestId, "booking_approved_good");
  void adjustTrustScore(b.guestId, 5);

  void recordSybnbEvent({
    type: SYBNB_ANALYTICS_EVENT_TYPES.BOOKING_APPROVED,
    listingId: b.listingId,
    userId: input.userId,
    metadata: { bookingId: b.id },
  });

  return { ok: true, booking: updated };
}

export async function hostDeclineSybnbV1Request(input: { userId: string; userRole: SyriaUserRole; bookingId: string }): Promise<HostActionResult> {
  const b = await prisma.sybnbBooking.findUnique({ where: { id: input.bookingId.trim() } });
  if (!b) {
    return { ok: false, code: "not_found" };
  }
  const isHost = b.hostId === input.userId;
  const isAdmin = input.userRole === "ADMIN";
  if (!isHost && !isAdmin) {
    return { ok: false, code: "forbidden" };
  }
  if (b.status !== "requested") {
    return { ok: false, code: "bad_state" };
  }
  const priorDeclinedCount = await prisma.sybnbBooking.count({
    where: {
      guestId: b.guestId,
      status: "declined",
      id: { not: b.id },
    },
  });
  const updated = await prisma.sybnbBooking.update({
    where: { id: b.id },
    data: { status: "declined" },
  });
  if (priorDeclinedCount >= 1) {
    void adjustTrustScore(b.guestId, -10);
  }
  return { ok: true, booking: updated };
}

/** SYBNB-5: manual “booking locked in” after host & guest align (e.g. payment arranged). `approved` → `confirmed`. */
export async function hostConfirmSybnbV1Booking(input: { userId: string; userRole: SyriaUserRole; bookingId: string }): Promise<HostActionResult> {
  const b = await prisma.sybnbBooking.findUnique({ where: { id: input.bookingId.trim() } });
  if (!b) {
    return { ok: false, code: "not_found" };
  }
  const isHost = b.hostId === input.userId;
  const isAdmin = input.userRole === "ADMIN";
  if (!isHost && !isAdmin) {
    return { ok: false, code: "forbidden" };
  }
  if (b.status !== "approved") {
    return { ok: false, code: "bad_state" };
  }
  const updated = await prisma.sybnbBooking.update({
    where: { id: b.id },
    data: { status: "confirmed" },
  });

  void logTimelineEvent({
    entityType: "sybnb_booking",
    entityId: b.id,
    action: "sybnb_booking_confirmed",
    actorId: input.userId,
    actorRole: isAdmin ? "admin" : "host",
    metadata: { listingId: b.listingId },
  });

  return { ok: true, booking: updated };
}
