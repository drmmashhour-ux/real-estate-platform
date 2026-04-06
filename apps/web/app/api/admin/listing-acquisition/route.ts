import { NextResponse } from "next/server";
import {
  ListingAcquisitionSourceType,
  ListingAcquisitionPermissionStatus,
  ListingAcquisitionIntakeStatus,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { normalizeListingDescription } from "@/lib/listings/normalize-listing-description";

export const dynamic = "force-dynamic";

/** GET /api/admin/listing-acquisition */
export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const leads = await prisma.listingAcquisitionLead.findMany({
    orderBy: { updatedAt: "desc" },
    take: 500,
    include: {
      assignedTo: { select: { email: true, name: true } },
      linkedFsboListing: { select: { id: true, listingCode: true, status: true } },
      linkedShortTermListing: { select: { id: true, listingCode: true, listingStatus: true } },
    },
  });

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const weekStart = new Date();
  weekStart.setUTCDate(weekStart.getUTCDate() - 7);

  const [newToday, awaitingAssets, readyForReview, publishedWeek, byCity, byStage, bySource] = await Promise.all([
    prisma.listingAcquisitionLead.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.listingAcquisitionLead.count({ where: { intakeStatus: "AWAITING_ASSETS" } }),
    prisma.listingAcquisitionLead.count({ where: { intakeStatus: "READY_FOR_REVIEW" } }),
    prisma.listingAcquisitionLead.count({
      where: { intakeStatus: "PUBLISHED", updatedAt: { gte: weekStart } },
    }),
    prisma.listingAcquisitionLead.groupBy({
      by: ["city"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 12,
    }),
    prisma.listingAcquisitionLead.groupBy({
      by: ["intakeStatus"],
      _count: { id: true },
    }),
    prisma.listingAcquisitionLead.groupBy({
      by: ["sourceType"],
      _count: { id: true },
    }),
  ]);

  return NextResponse.json({
    leads,
    metrics: {
      newToday,
      awaitingAssets,
      readyForReview,
      publishedThisWeek: publishedWeek,
      byCity,
      byStage,
      bySource,
    },
  });
}

/** POST /api/admin/listing-acquisition — manual lead */
export async function POST(req: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const st = String(body.sourceType ?? "").toUpperCase();
  const sourceType =
    st === "OWNER"
      ? ListingAcquisitionSourceType.OWNER
      : st === "BROKER"
        ? ListingAcquisitionSourceType.BROKER
        : st === "HOST"
          ? ListingAcquisitionSourceType.HOST
          : st === "MANUAL"
            ? ListingAcquisitionSourceType.MANUAL
            : null;
  if (!sourceType) {
    return NextResponse.json({ error: "Invalid sourceType" }, { status: 400 });
  }

  const contactName = String(body.contactName ?? "").trim();
  const contactEmail = String(body.contactEmail ?? "").trim().toLowerCase();
  const city = String(body.city ?? "").trim();
  const propertyCategory = String(body.propertyCategory ?? "").trim();
  if (!contactName || !contactEmail || !city || !propertyCategory) {
    return NextResponse.json({ error: "contactName, contactEmail, city, propertyCategory required" }, { status: 400 });
  }

  const perm = String(body.permissionStatus ?? "UNKNOWN").toUpperCase();
  const permissionStatus =
    perm === "REQUESTED"
      ? ListingAcquisitionPermissionStatus.REQUESTED
      : perm === "GRANTED"
        ? ListingAcquisitionPermissionStatus.GRANTED
        : perm === "REJECTED"
          ? ListingAcquisitionPermissionStatus.REJECTED
          : ListingAcquisitionPermissionStatus.UNKNOWN;

  const intake = String(body.intakeStatus ?? "NEW").toUpperCase();
  const intakeStatus = Object.values(ListingAcquisitionIntakeStatus).includes(intake as ListingAcquisitionIntakeStatus)
    ? (intake as ListingAcquisitionIntakeStatus)
    : ListingAcquisitionIntakeStatus.NEW;

  const descRaw = typeof body.description === "string" ? body.description : "";
  const { text: description } = normalizeListingDescription(descRaw);

  const row = await prisma.listingAcquisitionLead.create({
    data: {
      sourceType,
      contactName,
      contactEmail,
      contactPhone: typeof body.contactPhone === "string" ? body.contactPhone.trim() : null,
      city,
      propertyCategory,
      sourcePlatformText: typeof body.sourcePlatformText === "string" ? body.sourcePlatformText.trim() : null,
      permissionStatus,
      intakeStatus,
      notes: typeof body.notes === "string" ? body.notes.trim() : null,
      assignedToUserId: typeof body.assignedToUserId === "string" ? body.assignedToUserId : null,
      priceCents: typeof body.priceCents === "number" ? body.priceCents : null,
      bedrooms: typeof body.bedrooms === "number" ? body.bedrooms : null,
      bathrooms: typeof body.bathrooms === "number" ? body.bathrooms : null,
      description: description || null,
      amenitiesText: typeof body.amenitiesText === "string" ? body.amenitiesText.trim() : null,
    },
  });

  return NextResponse.json({ ok: true, id: row.id }, { status: 201 });
}
