"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { assertDarlinkRuntimeEnv } from "@/lib/guard";
import { revalidateSyriaPaths } from "@/lib/revalidate-locale";

export async function markSybnbReportReviewed(formData: FormData): Promise<void> {
  assertDarlinkRuntimeEnv();
  await requireAdmin();
  const id = String(formData.get("reportId") ?? "").trim();
  if (!id) return;
  await prisma.sybnbListingReport.update({ where: { id }, data: { reviewed: true } });
  await revalidateSyriaPaths("/admin/sybnb/reports", "/admin/sybnb/bookings", "/sybnb", "/sybnb/host");
  revalidatePath("/[locale]/admin/sybnb/reports", "page");
}

export async function markAllSybnbReportsReviewedForListing(formData: FormData): Promise<void> {
  assertDarlinkRuntimeEnv();
  await requireAdmin();
  const propertyId = String(formData.get("propertyId") ?? "").trim();
  if (!propertyId) return;
  await prisma.sybnbListingReport.updateMany({ where: { propertyId, reviewed: false }, data: { reviewed: true } });
  await revalidateSyriaPaths("/admin/sybnb/reports", "/sybnb", "/sybnb/host");
  revalidatePath("/[locale]/admin/sybnb/reports", "page");
}

export async function adminArchiveSybnbListing(formData: FormData): Promise<void> {
  assertDarlinkRuntimeEnv();
  await requireAdmin();
  const propertyId = String(formData.get("propertyId") ?? "").trim();
  if (!propertyId) return;
  await prisma.syriaProperty.update({
    where: { id: propertyId, category: "stay" },
    data: { status: "ARCHIVED" },
  });
  await revalidateSyriaPaths("/admin/sybnb/reports", "/admin/listings", "/sybnb", "/sybnb/host", `/sybnb/listings/${propertyId}`);
  revalidatePath("/[locale]/admin/sybnb/reports", "page");
}

/**
 * Dismiss without archiving: mark Sybnb reports reviewed and return listing to the public feed.
 */
export async function adminKeepSybnbListingActive(formData: FormData): Promise<void> {
  assertDarlinkRuntimeEnv();
  await requireAdmin();
  const propertyId = String(formData.get("propertyId") ?? "").trim();
  if (!propertyId) {
    return;
  }
  await prisma.sybnbListingReport.updateMany({ where: { propertyId, reviewed: false }, data: { reviewed: true } });
  await prisma.syriaProperty.update({
    where: { id: propertyId, category: "stay" },
    data: { needsReview: false, status: "PUBLISHED" },
  });
  await revalidateSyriaPaths(
    "/admin/sybnb/reports",
    "/sybnb",
    "/sybnb/host",
    "/",
    "/listing",
    `/sybnb/listings/${propertyId}`,
  );
  revalidatePath("/[locale]/admin/sybnb/reports", "page");
}

export async function adminSetSybnbBookingManualClear(formData: FormData): Promise<void> {
  assertDarlinkRuntimeEnv();
  await requireAdmin();
  const bookingId = String(formData.get("bookingId") ?? "").trim();
  if (!bookingId) return;
  const b = await prisma.syriaBooking.findUnique({ where: { id: bookingId }, include: { property: true } });
  if (!b || b.property.category !== "stay") return;
  await prisma.syriaBooking.update({ where: { id: bookingId }, data: { riskStatus: "clear" } });
  await revalidateSyriaPaths("/admin/sybnb/bookings", "/sybnb", "/sybnb/bookings", "/dashboard/bookings");
}
