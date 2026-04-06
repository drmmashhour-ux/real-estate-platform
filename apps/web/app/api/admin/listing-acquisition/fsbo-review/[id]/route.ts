import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { FSBO_MODERATION, FSBO_STATUS } from "@/lib/fsbo/constants";

export const dynamic = "force-dynamic";

type Action = "save" | "request_changes" | "approve_draft" | "publish" | "reject";

/**
 * POST /api/admin/listing-acquisition/fsbo-review/[id]
 * Safe supply review for FSBO rows (checklist + publish). `id` = FsboListing.id.
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await ctx.params;
  const fsbo = await prisma.fsboListing.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      moderationStatus: true,
      supplyPublicationStage: true,
    },
  });
  if (!fsbo) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const action = (typeof body.action === "string" ? body.action : "save") as Action;

  const data: Record<string, unknown> = {};
  if (typeof body.permissionSourceNote === "string") {
    data.permissionSourceNote = body.permissionSourceNote.trim() || null;
  }
  if (body.permissionConfirmedAt === true) {
    data.permissionConfirmedAt = new Date();
  } else if (typeof body.permissionConfirmedAt === "string" && body.permissionConfirmedAt) {
    const d = new Date(body.permissionConfirmedAt);
    if (!Number.isNaN(d.getTime())) data.permissionConfirmedAt = d;
  }
  if (typeof body.rewrittenDescriptionReviewed === "boolean") {
    data.rewrittenDescriptionReviewed = body.rewrittenDescriptionReviewed;
  }
  if (typeof body.imagesApproved === "boolean") {
    data.imagesApproved = body.imagesApproved;
  }
  if (typeof body.imageSourceNote === "string") {
    data.imageSourceNote = body.imageSourceNote.trim() || null;
  }
  if (typeof body.missingApprovedImages === "boolean") {
    data.missingApprovedImages = body.missingApprovedImages;
  }
  if (typeof body.supplyPublicationStage === "string") {
    data.supplyPublicationStage = body.supplyPublicationStage;
  }

  if (action === "save") {
    /* only field updates above */
  } else if (action === "request_changes") {
    data.supplyPublicationStage = "draft";
    data.moderationStatus = FSBO_MODERATION.PENDING;
  } else if (action === "approve_draft") {
    data.moderationStatus = FSBO_MODERATION.APPROVED;
    data.supplyPublicationStage = "approved";
    data.status = FSBO_STATUS.DRAFT;
  } else if (action === "publish") {
    data.moderationStatus = FSBO_MODERATION.APPROVED;
    data.supplyPublicationStage = "published";
    data.status = FSBO_STATUS.ACTIVE;
  } else if (action === "reject") {
    data.moderationStatus = FSBO_MODERATION.REJECTED;
    data.supplyPublicationStage = "rejected";
    const reason = typeof body.rejectReason === "string" ? body.rejectReason.trim() : "";
    data.rejectReason = reason || "Does not meet publication requirements.";
  }

  const updated = await prisma.fsboListing.update({
    where: { id },
    data: data as Parameters<typeof prisma.fsboListing.update>[0]["data"],
    select: { id: true, status: true, moderationStatus: true, supplyPublicationStage: true },
  });

  if (action === "publish" || action === "reject") {
    await prisma.listingAcquisitionLead.updateMany({
      where: { linkedFsboListingId: id },
      data: {
        intakeStatus: action === "publish" ? "PUBLISHED" : "ARCHIVED",
      },
    });
  }

  return NextResponse.json({ ok: true, listing: updated });
}
