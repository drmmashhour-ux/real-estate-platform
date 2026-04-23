import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { ListingAcquisitionSourceType } from "@prisma/client";
import { prisma } from "@repo/db";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { allocateUniqueLSTListingCode } from "@/lib/listing-code";
import { normalizeListingDescription } from "@/lib/listings/normalize-listing-description";
import { FSBO_MODERATION, FSBO_STATUS } from "@/lib/fsbo/constants";
import { markGrowthEngineLeadConvertedForAcquisition } from "@/lib/growth/lead-service";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/listing-acquisition/[id]/convert
 * Creates a draft FSBO or BNHUB stay — never auto-published.
 * Body: { ownerUserId: string, target?: "fsbo" | "stay" }
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await ctx.params;
  const lead = await prisma.listingAcquisitionLead.findUnique({ where: { id } });
  if (!lead) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (lead.linkedFsboListingId || lead.linkedShortTermListingId || lead.linkedCrmListingId) {
    return NextResponse.json({ error: "Lead already linked to a listing" }, { status: 409 });
  }

  let body: { ownerUserId?: string; target?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const ownerUserId = typeof body.ownerUserId === "string" ? body.ownerUserId.trim() : "";
  if (!ownerUserId) {
    return NextResponse.json({ error: "ownerUserId required" }, { status: 400 });
  }

  const owner = await prisma.user.findUnique({ where: { id: ownerUserId }, select: { id: true } });
  if (!owner) {
    return NextResponse.json({ error: "Owner user not found" }, { status: 404 });
  }

  let target = body.target === "stay" ? "stay" : "fsbo";
  if (lead.sourceType === ListingAcquisitionSourceType.HOST) {
    target = "stay";
  }

  const { text: normalizedDesc } = normalizeListingDescription(lead.description ?? "");
  const description = normalizedDesc || "Draft — description must be rewritten before publish.";
  const imageUrls = Array.isArray(lead.submittedImageUrls)
    ? (lead.submittedImageUrls as unknown[]).filter((u): u is string => typeof u === "string" && u.startsWith("http"))
    : [];

  if (target === "stay") {
    const result = await prisma.$transaction(async (tx) => {
      const listingCode = await allocateUniqueLSTListingCode(tx);
      const nightPriceCents =
        lead.priceCents && lead.priceCents > 0 ? Math.min(lead.priceCents, 50_000_000) : 10_000;
      const beds = lead.bedrooms && lead.bedrooms > 0 ? lead.bedrooms : 1;
      const baths = lead.bathrooms && lead.bathrooms > 0 ? lead.bathrooms : 1;
      const stay = await tx.shortTermListing.create({
        data: {
          listingCode,
          title: `${lead.propertyCategory} — ${lead.city}`.slice(0, 200),
          description,
          address: `Draft address — ${lead.city}`,
          city: lead.city,
          country: "CA",
          listingStatus: "DRAFT",
          listingVerificationStatus: "DRAFT",
          nightPriceCents,
          beds,
          baths,
          maxGuests: Math.max(2, beds * 2),
          ownerId: ownerUserId,
          photos: imageUrls as unknown as Prisma.InputJsonValue,
          permissionConfirmedAt: lead.permissionConfirmedAt,
          permissionSourceNote: lead.sourcePlatformText,
          imagesApproved: false,
          missingApprovedImages: imageUrls.length === 0,
        },
      });
      await tx.listingAcquisitionLead.update({
        where: { id: lead.id },
        data: {
          linkedShortTermListingId: stay.id,
          intakeStatus: "READY_FOR_REVIEW",
        },
      });
      return stay;
    });
    await markGrowthEngineLeadConvertedForAcquisition(lead.id);
    return NextResponse.json({ ok: true, target: "stay", listingId: result.id, listingCode: result.listingCode });
  }

  const result = await prisma.$transaction(async (tx) => {
    const listingCode = await allocateUniqueLSTListingCode(tx);
    const listingOwnerType =
      lead.sourceType === ListingAcquisitionSourceType.BROKER || lead.sourceType === ListingAcquisitionSourceType.MANUAL
        ? "BROKER"
        : "SELLER";
    const priceCents = lead.priceCents && lead.priceCents > 0 ? lead.priceCents : 1;
    const fsbo = await tx.fsboListing.create({
      data: {
        listingCode,
        ownerId: ownerUserId,
        title: `${lead.propertyCategory} — ${lead.city}`.slice(0, 200),
        description,
        priceCents,
        address: `Draft — ${lead.city}`,
        city: lead.city,
        contactEmail: lead.contactEmail,
        contactPhone: lead.contactPhone,
        status: FSBO_STATUS.DRAFT,
        moderationStatus: FSBO_MODERATION.PENDING,
        supplyPublicationStage: "pending_review",
        listingOwnerType,
        bedrooms: lead.bedrooms ?? undefined,
        bathrooms: lead.bathrooms ?? undefined,
        propertyType: lead.propertyCategory.slice(0, 80),
        images: imageUrls,
        permissionConfirmedAt: lead.permissionConfirmedAt,
        permissionSourceNote: lead.sourcePlatformText,
        rewrittenDescriptionReviewed: false,
        imagesApproved: false,
        missingApprovedImages: imageUrls.length === 0,
      },
    });
    await tx.listingAcquisitionLead.update({
      where: { id: lead.id },
      data: {
        linkedFsboListingId: fsbo.id,
        intakeStatus: "READY_FOR_REVIEW",
      },
    });
    return fsbo;
  });

  await markGrowthEngineLeadConvertedForAcquisition(lead.id);

  return NextResponse.json({
    ok: true,
    target: "fsbo",
    listingId: result.id,
    listingCode: result.listingCode,
  });
}
