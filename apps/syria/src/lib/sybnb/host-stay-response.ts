import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { sybnbConfig } from "@/config/sybnb.config";
import type { SyriaAppUser, SyriaUserRole } from "@/generated/prisma";
import { trackSyriaGrowthEvent } from "@/lib/growth-events";
import { revalidateSyriaPaths } from "@/lib/revalidate-locale";
import { syriaFlags } from "@/lib/platform-flags";
import { assertDarlinkRuntimeEnv } from "@/lib/guard";
import { evaluateSybnbStayRequestEligibility, sybnbBookingRowMatchesServerQuote } from "./sybnb-booking-rules";
import { countUnreviewedSybnbReportsForProperty } from "./sybnb-reports";
import { appendSyriaSybnbCoreAudit } from "./sybnb-financial-audit";
import { isAllowedSybnbStayStatusTransition } from "./sybnb-state-machine";

type HostAction = "confirm" | "decline";

export type SybnbHostStayResponseError =
  | "mvp"
  | "not_found"
  | "forbidden"
  | "not_pending"
  | "not_stay"
  | "decline_transition"
  | "confirm_eligibility"
  | "price_mismatch"
  | "approve_transition";

/**
 * Approve or decline a stay booking (SYBNB / SyriaBooking). No redirects — safe for API routes.
 * Caller must have already resolved an authenticated `SyriaAppUser`.
 */
export async function runSybnbHostStayResponse(input: {
  user: SyriaAppUser;
  bookingId: string;
  action: HostAction;
}): Promise<{ ok: true } | { ok: false; error: SybnbHostStayResponseError }> {
  assertDarlinkRuntimeEnv();
  if (syriaFlags.SYRIA_MVP) {
    return { ok: false, error: "mvp" };
  }

  const { user, action } = input;
  const bookingId = input.bookingId.trim();
  if (!bookingId) {
    return { ok: false, error: "not_found" };
  }

  const booking = await prisma.syriaBooking.findUnique({
    where: { id: bookingId },
    include: { property: { include: { owner: true } } },
  });
  if (!booking || booking.status !== "PENDING") {
    return { ok: false, error: "not_pending" };
  }
  if (booking.property.category !== "stay") {
    return { ok: false, error: "not_stay" };
  }

  const isHost = booking.property.ownerId === user.id;
  const isAdmin = user.role === "ADMIN";
  if (!isHost && !isAdmin) {
    return { ok: false, error: "forbidden" };
  }

  if (action === "decline") {
    if (!isAllowedSybnbStayStatusTransition(booking.status, "CANCELLED")) {
      return { ok: false, error: "decline_transition" };
    }
    await prisma.syriaBooking.update({
      where: { id: bookingId },
      data: { status: "CANCELLED" },
    });
    await appendSyriaSybnbCoreAudit({
      bookingId: booking.id,
      event: "host_declined_stay",
      metadata: { by: isAdmin ? "admin" : "host" },
    });
    await revalidateSyriaPaths("/dashboard/bookings", "/admin/bookings", "/sybnb", `/listing/${booking.propertyId}`);
    return { ok: true };
  }

  const unreviewed = await countUnreviewedSybnbReportsForProperty(booking.propertyId);
  if (evaluateSybnbStayRequestEligibility(booking.property, booking.property.owner, { unreviewedReportCount: unreviewed }).ok !== true) {
    return { ok: false, error: "confirm_eligibility" };
  }
  if (!sybnbBookingRowMatchesServerQuote(booking, booking.property)) {
    return { ok: false, error: "price_mismatch" };
  }
  if (!isAllowedSybnbStayStatusTransition(booking.status, "APPROVED")) {
    return { ok: false, error: "approve_transition" };
  }

  const cardPath = sybnbConfig.paymentsEnabled && sybnbConfig.provider === "stripe";
  if (cardPath) {
    const sessionId = `stub_cs_${randomBytes(10).toString("hex")}`;
    await prisma.syriaBooking.update({
      where: { id: bookingId },
      data: {
        status: "APPROVED",
        guestPaymentStatus: "UNPAID",
        sybnbCheckoutSessionId: sessionId,
      },
    });
  } else {
    await prisma.syriaBooking.update({
      where: { id: bookingId },
      data: {
        status: "APPROVED",
        guestPaymentStatus: "PENDING_MANUAL",
      },
    });
  }

  await appendSyriaSybnbCoreAudit({
    bookingId: booking.id,
    event: "host_approved_stay",
    metadata: { by: isAdmin ? "admin" : "host", next: cardPath ? "awaiting_card" : "manual_required" },
  });

  await trackSyriaGrowthEvent({
    eventType: "sybnb_host_approved_booking",
    userId: booking.guestId,
    propertyId: booking.propertyId,
    bookingId: booking.id,
    payload: { by: isAdmin ? "admin" : "host", next: cardPath ? "awaiting_card" : "manual_required" },
  });

  await revalidateSyriaPaths("/dashboard/bookings", "/admin/bookings", "/sybnb", `/listing/${booking.propertyId}`);

  return { ok: true };
}
