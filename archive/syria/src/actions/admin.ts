"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { revalidateSyriaPaths } from "@/lib/revalidate-locale";
import { syriaPlatformConfig } from "@/config/syria-platform.config";
import { trackSyriaGrowthEvent } from "@/lib/growth-events";
import { persistAutonomyPreview } from "@/lib/autonomy-recommendations";
import { assertDarlinkRuntimeEnv } from "@/lib/guard";

export async function approveProperty(formData: FormData): Promise<void> {
  assertDarlinkRuntimeEnv();
  await requireAdmin();
  const id = String(formData.get("propertyId") ?? "").trim();
  if (!id) return;

  const payments = await prisma.syriaListingPayment.findMany({
    where: { propertyId: id },
  });
  const featuredPaid = payments.some(
    (p) => p.purpose === "FEATURED" && p.status === "VERIFIED",
  );
  const featuredPayment = payments.find(
    (p) => p.purpose === "FEATURED" && p.status === "VERIFIED",
  );

  const durationMs =
    syriaPlatformConfig.monetization.featuredDurationDays * 24 * 60 * 60 * 1000;
  const featuredUntil = featuredPaid ? new Date(Date.now() + durationMs) : null;

  await prisma.$transaction(async (tx) => {
    await tx.syriaProperty.update({
      where: { id },
      data: {
        status: "PUBLISHED",
        isFeatured: featuredPaid,
        featuredUntil,
        featuredPriority: featuredPaid ? 10 : 0,
      },
    });

    if (featuredPaid && featuredPayment) {
      const startsAt = new Date();
      const endsAt = featuredUntil;
      await tx.syriaFeaturedPlacement.deleteMany({
        where: { propertyId: id, zone: { in: ["HOME", "SEARCH_BOOST"] } },
      });
      await tx.syriaFeaturedPlacement.createMany({
        data: [
          {
            propertyId: id,
            zone: "HOME",
            priority: 10,
            active: true,
            startsAt,
            endsAt,
            linkedListingPaymentId: featuredPayment.id,
          },
          {
            propertyId: id,
            zone: "SEARCH_BOOST",
            priority: 6,
            active: true,
            startsAt,
            endsAt,
            linkedListingPaymentId: featuredPayment.id,
          },
        ],
      });
    }
  });

  await revalidateSyriaPaths("/admin/listings", "/buy", "/rent", "/bnhub/stays", "/");
}

export async function rejectProperty(formData: FormData): Promise<void> {
  assertDarlinkRuntimeEnv();
  await requireAdmin();
  const id = String(formData.get("propertyId") ?? "").trim();
  if (!id) return;

  await prisma.syriaProperty.update({
    where: { id },
    data: { status: "REJECTED" },
  });

  await revalidateSyriaPaths("/admin/listings");
}

export async function verifyListingPayment(formData: FormData): Promise<void> {
  assertDarlinkRuntimeEnv();
  await requireAdmin();
  const id = String(formData.get("paymentId") ?? "").trim();
  if (!id) return;

  await prisma.syriaListingPayment.update({
    where: { id },
    data: { status: "VERIFIED" },
  });

  await revalidateSyriaPaths("/admin/listings");
}

export async function verifyGuestBookingPayment(formData: FormData): Promise<void> {
  assertDarlinkRuntimeEnv();
  await requireAdmin();
  const bookingId = String(formData.get("bookingId") ?? "").trim();
  if (!bookingId) return;

  const booking = await prisma.syriaBooking.update({
    where: { id: bookingId },
    data: { guestPaymentStatus: "PAID", status: "CONFIRMED" },
  });

  await trackSyriaGrowthEvent({
    eventType: "booking_confirmed",
    userId: booking.guestId,
    propertyId: booking.propertyId,
    bookingId: booking.id,
    payload: {
      total: booking.totalPrice.toString(),
      platformFee: booking.platformFeeAmount?.toString() ?? null,
      hostNet: booking.hostNetAmount?.toString() ?? null,
      currency: booking.currency,
    },
  });

  await revalidateSyriaPaths("/admin/bookings", "/dashboard/bookings");
}

export async function approvePayout(formData: FormData): Promise<void> {
  assertDarlinkRuntimeEnv();
  await requireAdmin();
  const payoutId = String(formData.get("payoutId") ?? "").trim();
  if (!payoutId) return;

  const updated = await prisma.syriaPayout.updateMany({
    where: { id: payoutId, status: "PENDING" },
    data: { status: "APPROVED", approvedAt: new Date() },
  });
  if (updated.count === 0) return;

  const payout = await prisma.syriaPayout.findUniqueOrThrow({
    where: { id: payoutId },
  });

  await prisma.syriaBooking.update({
    where: { id: payout.bookingId },
    data: { payoutStatus: "APPROVED" },
  });

  await revalidateSyriaPaths("/admin/payouts", "/admin/bookings");
}

export async function markPayoutPaid(formData: FormData): Promise<void> {
  assertDarlinkRuntimeEnv();
  await requireAdmin();
  const payoutId = String(formData.get("payoutId") ?? "").trim();
  if (!payoutId) return;

  const marked = await prisma.syriaPayout.updateMany({
    where: { id: payoutId, status: "APPROVED" },
    data: { status: "PAID", paidAt: new Date() },
  });
  if (marked.count === 0) return;

  const existing = await prisma.syriaPayout.findUnique({
    where: { id: payoutId },
  });
  if (!existing) return;

  await prisma.syriaBooking.update({
    where: { id: existing.bookingId },
    data: { payoutStatus: "PAID" },
  });

  await revalidateSyriaPaths("/admin/payouts", "/admin/bookings");
}

export async function setPropertyFraudFlag(formData: FormData): Promise<void> {
  assertDarlinkRuntimeEnv();
  await requireAdmin();
  const id = String(formData.get("propertyId") ?? "").trim();
  const fraud = String(formData.get("fraud") ?? "") === "true";

  if (!id) return;

  await prisma.syriaProperty.update({
    where: { id },
    data: { fraudFlag: fraud },
  });

  await revalidateSyriaPaths("/admin/listings");
}

export async function setBookingFraudFlag(formData: FormData): Promise<void> {
  assertDarlinkRuntimeEnv();
  await requireAdmin();
  const id = String(formData.get("bookingId") ?? "").trim();
  const fraud = String(formData.get("fraud") ?? "") === "true";

  if (!id) return;

  await prisma.syriaBooking.update({
    where: { id },
    data: { fraudFlag: fraud },
  });

  await revalidateSyriaPaths("/admin/bookings");
}

export async function setUserRole(formData: FormData): Promise<void> {
  assertDarlinkRuntimeEnv();
  await requireAdmin();
  const userId = String(formData.get("userId") ?? "").trim();
  const role = String(formData.get("role") ?? "USER").toUpperCase();
  if (!userId) return;
  if (!["USER", "HOST", "ADMIN"].includes(role)) return;

  await prisma.syriaAppUser.update({
    where: { id: userId },
    data: { role: role as "USER" | "HOST" | "ADMIN" },
  });

  await revalidateSyriaPaths("/admin/users");
}

export async function setFeaturedPlacementActive(formData: FormData): Promise<void> {
  assertDarlinkRuntimeEnv();
  await requireAdmin();
  const placementId = String(formData.get("placementId") ?? "").trim();
  const active = String(formData.get("active") ?? "true") !== "false";
  if (!placementId) return;

  await prisma.syriaFeaturedPlacement.update({
    where: { id: placementId },
    data: { active },
  });

  await revalidateSyriaPaths("/admin/promotions");
}

export async function regenerateAutonomyRecommendations(formData: FormData): Promise<void> {
  assertDarlinkRuntimeEnv();
  await requireAdmin();
  const propertyId = String(formData.get("propertyId") ?? "").trim();
  if (!propertyId) return;

  const property = await prisma.syriaProperty.findUnique({ where: { id: propertyId } });
  if (!property) return;

  await persistAutonomyPreview(property.id, property.ownerId);

  await revalidateSyriaPaths("/admin/autonomy");
}

export async function resolveAutonomyRecommendation(formData: FormData): Promise<void> {
  assertDarlinkRuntimeEnv();
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  const statusRaw = String(formData.get("status") ?? "").toUpperCase();
  if (!id) return;
  if (statusRaw !== "DISMISSED" && statusRaw !== "ACKNOWLEDGED") return;

  await prisma.syriaAutonomyRecommendation.update({
    where: { id },
    data: { status: statusRaw as "DISMISSED" | "ACKNOWLEDGED", resolvedAt: new Date() },
  });

  await revalidateSyriaPaths("/admin/autonomy");
}
