"use server";

import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { requireSessionUser } from "@/lib/auth";
import { SYRIA_PRICING } from "@/lib/pricing";
import { syriaFlags } from "@/lib/platform-flags";
import { redirect } from "@/i18n/navigation";
import { revalidateSyriaPaths } from "@/lib/revalidate-locale";
import { parseUtmFromFormData } from "@/lib/utm";
import { trackSyriaGrowthEvent } from "@/lib/growth-events";
import { assertDarlinkRuntimeEnv } from "@/lib/guard";
import { sybnbConfig } from "@/config/sybnb.config";

function nightsBetween(checkIn: Date, checkOut: Date): number {
  const ms = checkOut.getTime() - checkIn.getTime();
  const n = Math.ceil(ms / 86400000);
  return Math.max(1, n);
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

  const nights = nightsBetween(checkIn, checkOut);
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
    include: { property: true },
  });
  if (!booking || booking.status !== "PENDING") {
    return;
  }
  if (booking.property.category !== "stay") {
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

  await prisma.syriaBooking.update({
    where: { id: bookingId },
    data: { status: "CONFIRMED" },
  });

  await trackSyriaGrowthEvent({
    eventType: "sybnb_booking_confirmed",
    userId: booking.guestId,
    propertyId: booking.propertyId,
    bookingId: booking.id,
    payload: { by: isAdmin ? "admin" : "host" },
  });

  await revalidateSyriaPaths("/dashboard/bookings", "/admin/bookings", "/sybnb", `/listing/${booking.propertyId}`);
}
