"use server";

import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { requireSessionUser } from "@/lib/auth";
import { syriaFlags } from "@/lib/platform-flags";
import { redirect } from "@/i18n/navigation";
import { revalidateSyriaPaths } from "@/lib/revalidate-locale";
import { parseUtmFromFormData } from "@/lib/utm";
import { trackSyriaGrowthEvent } from "@/lib/growth-events";
import { assertDarlinkRuntimeEnv } from "@/lib/guard";
import { sybnbConfig } from "@/config/sybnb.config";
import { computeSybnbQuote } from "@/lib/sybnb/sybnb-quote";
import { evaluateSybnbStayRequestEligibility } from "@/lib/sybnb/sybnb-booking-rules";

export type SybnbQuoteResult =
  | {
      ok: true;
      nights: number;
      nightly: string;
      total: string;
      platformFee: string;
      hostNet: string;
      currency: string;
    }
  | { ok: false; error: "not_found" | "invalid" };

/**
 * Server-side quote for the listing detail page (same math as `createSybnbStayBooking`).
 */
export async function getSybnbStayQuote(input: {
  propertyId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
}): Promise<SybnbQuoteResult> {
  const property = await prisma.syriaProperty.findUnique({
    where: { id: input.propertyId.trim() },
    include: { owner: true },
  });
  if (!property || property.category !== "stay" || property.type !== "RENT") {
    return { ok: false, error: "not_found" };
  }
  if (evaluateSybnbStayRequestEligibility(property, property.owner).ok !== true) {
    return { ok: false, error: "not_found" };
  }
  const checkIn = new Date(input.checkIn);
  const checkOut = new Date(input.checkOut);
  if (Number.isNaN(+checkIn) || Number.isNaN(+checkOut) || checkOut <= checkIn) {
    return { ok: false, error: "invalid" };
  }
  const q = computeSybnbQuote(property, checkIn, checkOut);
  return {
    ok: true,
    nights: q.nights,
    nightly: q.nightly.toString(),
    total: q.total.toString(),
    platformFee: q.platformFee.toString(),
    hostNet: q.hostNet.toString(),
    currency: q.currency,
  };
}

/**
 * After checkout date, mark confirmed stays as completed (SYBNB / stay only).
 */
export async function runSybnbPostStayCompletion(): Promise<void> {
  const now = new Date();
  const rows = await prisma.syriaBooking.findMany({
    where: {
      status: "CONFIRMED",
      checkOut: { lt: now },
      property: { category: "stay" },
    },
    select: { id: true },
  });
  if (rows.length === 0) return;
  await prisma.syriaBooking.updateMany({
    where: { id: { in: rows.map((r) => r.id) } },
    data: { status: "COMPLETED" },
  });
}

/**
 * Request-to-book for SYBNB (`category=stay`, `type=RENT`). Host confirms from dashboard; payout row created like BNHUB.
 */
export async function createSybnbStayBooking(formData: FormData): Promise<void> {
  assertDarlinkRuntimeEnv();
  if (syriaFlags.SYRIA_MVP) {
    return;
  }

  const guest = await requireSessionUser();
  const propertyId = String(formData.get("propertyId") ?? "").trim();
  const checkInRaw = String(formData.get("check_in") ?? "");
  const checkOutRaw = String(formData.get("check_out") ?? "");
  const manualRef = String(formData.get("manual_ref") ?? "").trim() || null;
  const proofUrl = String(formData.get("proof_url") ?? "").trim() || null;
  const guestCountRaw = Number(String(formData.get("guest_count") ?? "").trim());
  const utm = parseUtmFromFormData(formData);

  const checkIn = new Date(checkInRaw);
  const checkOut = new Date(checkOutRaw);
  if (!propertyId || Number.isNaN(+checkIn) || Number.isNaN(+checkOut)) {
    return;
  }
  if (checkOut <= checkIn) {
    return;
  }

  const property = await prisma.syriaProperty.findUnique({
    where: { id: propertyId },
    include: { owner: true },
  });
  if (!property || property.category !== "stay" || property.type !== "RENT") {
    return;
  }
  if (property.sybnbReview !== "APPROVED" || property.status !== "PUBLISHED" || property.fraudFlag) {
    return;
  }
  if (property.owner.sybnbSupplyPaused) {
    return;
  }
  if (guest.id === property.ownerId) {
    return;
  }

  const nights = sybnbNightsBetween(checkIn, checkOut);
  const nightlyDec =
    property.pricePerNight != null
      ? new Prisma.Decimal(property.pricePerNight)
      : property.price;
  const totalPrice = nightlyDec.mul(new Prisma.Decimal(nights));
  const guestCount = Number.isFinite(guestCountRaw) && guestCountRaw > 0 ? Math.floor(guestCountRaw) : null;

  const rate = new Prisma.Decimal(String(SYRIA_PRICING.bnhubCommissionRate));
  const platformFee = totalPrice.mul(rate);
  const hostAmount = totalPrice.sub(platformFee);
  const guestPaymentStatus = manualRef ? "PENDING_MANUAL" : "UNPAID";

  const created = await prisma.$transaction(async (tx) => {
    const b = await tx.syriaBooking.create({
      data: {
        propertyId: property.id,
        guestId: guest.id,
        checkIn,
        checkOut,
        nightsCount: nights,
        nightlyRate: nightlyDec,
        totalPrice,
        platformFeeAmount: platformFee,
        hostNetAmount: hostAmount,
        currency: SYRIA_PRICING.currency,
        status: "PENDING",
        guestPaymentStatus,
        payoutStatus: "PENDING",
        manualPaymentRef: manualRef,
        proofUrl,
        guestCount,
        utmSource: utm.utmSource,
        utmMedium: utm.utmMedium,
        utmCampaign: utm.utmCampaign,
      },
    });
    await tx.syriaPayout.create({
      data: {
        bookingId: b.id,
        hostId: property.ownerId,
        amount: hostAmount,
        platformFee,
        currency: SYRIA_PRICING.currency,
        status: "PENDING",
      },
    });
    return b;
  });

  await trackSyriaGrowthEvent({
    eventType: "sybnb_booking_request_created",
    userId: guest.id,
    propertyId: property.id,
    bookingId: created.id,
    utm,
    payload: {
      nights,
      total: created.totalPrice.toString(),
      provider: sybnbConfig.provider,
    },
  });

  await revalidateSyriaPaths(
    `/listing/${propertyId}`,
    "/dashboard/bookings",
    "/sybnb",
    "/admin/bookings",
  );
  redirect({ href: "/dashboard/bookings", locale: "ar" });
}

export async function hostRespondSybnbBooking(formData: FormData): Promise<void> {
  assertDarlinkRuntimeEnv();
  if (syriaFlags.SYRIA_MVP) {
    return;
  }

  const user = await requireSessionUser();
  const bookingId = String(formData.get("bookingId") ?? "").trim();
  const action = String(formData.get("action") ?? "").trim().toLowerCase();
  if (!bookingId || (action !== "confirm" && action !== "decline")) {
    return;
  }

  const booking = await prisma.syriaBooking.findUnique({
    where: { id: bookingId },
    include: { property: { include: { owner: true } } },
  });
  if (!booking || booking.status !== "PENDING") {
    return;
  }
  if (booking.property.category !== "stay") {
    return;
  }
  if (action === "confirm" && evaluateSybnbStayRequestEligibility(booking.property, booking.property.owner).ok !== true) {
    return;
  }
  const isHost = booking.property.ownerId === user.id;
  const isAdmin = user.role === "ADMIN";
  if (!isHost && !isAdmin) {
    return;
  }

  if (action === "decline") {
    await prisma.syriaBooking.update({
      where: { id: bookingId },
      data: { status: "CANCELLED" },
    });
    await revalidateSyriaPaths("/dashboard/bookings", "/admin/bookings", "/sybnb", `/listing/${booking.propertyId}`);
    return;
  }

  if (evaluateSybnbStayRequestEligibility(booking.property, booking.property.owner).ok !== true) {
    return;
  }
  if (!sybnbBookingRowMatchesServerQuote(booking, booking.property)) {
    return;
  }

  /// Host approved: next step is manual settlement or Stripe checkout (stub), not final confirmation until payment/webhook.
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

  await trackSyriaGrowthEvent({
    eventType: "sybnb_host_approved_booking",
    userId: booking.guestId,
    propertyId: booking.propertyId,
    bookingId: booking.id,
    payload: { by: isAdmin ? "admin" : "host", next: cardPath ? "awaiting_card" : "manual_required" },
  });

  await revalidateSyriaPaths("/dashboard/bookings", "/admin/bookings", "/sybnb", `/listing/${booking.propertyId}`);
}
