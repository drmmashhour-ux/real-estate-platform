import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import {
  ListingAcquisitionPermissionStatus,
  ListingAcquisitionIntakeStatus,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { normalizeListingDescription } from "@/lib/listings/normalize-listing-description";

export const dynamic = "force-dynamic";

/** PATCH /api/admin/listing-acquisition/[id] */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await ctx.params;
  const existing = await prisma.listingAcquisitionLead.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data: Prisma.ListingAcquisitionLeadUncheckedUpdateInput = {};

  if (typeof body.intakeStatus === "string") {
    const u = body.intakeStatus.toUpperCase();
    if (Object.values(ListingAcquisitionIntakeStatus).includes(u as ListingAcquisitionIntakeStatus)) {
      data.intakeStatus = u as ListingAcquisitionIntakeStatus;
    }
  }
  if (typeof body.permissionStatus === "string") {
    const u = body.permissionStatus.toUpperCase();
    if (Object.values(ListingAcquisitionPermissionStatus).includes(u as ListingAcquisitionPermissionStatus)) {
      data.permissionStatus = u as ListingAcquisitionPermissionStatus;
    }
  }
  if (typeof body.notes === "string") data.notes = body.notes.trim() || null;
  if (typeof body.assignedToUserId === "string") data.assignedToUserId = body.assignedToUserId || null;
  if (typeof body.contactPhone === "string") data.contactPhone = body.contactPhone.trim() || null;
  if (typeof body.sourcePlatformText === "string") data.sourcePlatformText = body.sourcePlatformText.trim() || null;
  if (typeof body.description === "string") {
    const { text } = normalizeListingDescription(body.description);
    data.description = text || null;
  }

  const row = await prisma.listingAcquisitionLead.update({ where: { id }, data });
  return NextResponse.json({ ok: true, lead: row });
}
