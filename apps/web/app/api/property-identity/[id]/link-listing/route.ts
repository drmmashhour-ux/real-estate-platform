import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { LISTING_TYPES, LINK_STATUSES } from "@/lib/property-identity/constants";
import { checkDuplicateOutcome } from "@/lib/property-identity/duplicate-rules";
import { recordEvent } from "@/lib/property-identity/events";

/**
 * POST /api/property-identity/:id/link-listing
 * Body: listing_id, listing_type, link_status? (default from duplicate check)
 * Links an existing listing to this property identity. In production enforce ownership.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const listingId = body.listing_id as string;
    const listingType = body.listing_type as string;
    const requestedStatus = body.link_status as string | undefined;

    if (!listingId || !listingType || !LISTING_TYPES.includes(listingType as never)) {
      return Response.json({ error: "listing_id and listing_type (sale|long_term_rental|short_term_rental) required" }, { status: 400 });
    }

    const identity = await prisma.propertyIdentity.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!identity) {
      return Response.json({ error: "Property identity not found" }, { status: 404 });
    }

    const existing = await prisma.propertyIdentityLink.findUnique({
      where: {
        listingId_listingType: { listingId, listingType },
      },
    });
    if (existing) {
      return Response.json(
        { error: "This listing is already linked to a property identity", link_id: existing.id },
        { status: 400 }
      );
    }

    const duplicateOutcome = await checkDuplicateOutcome(id, listingId, listingType as "sale" | "long_term_rental" | "short_term_rental", userId);
    let linkStatus = requestedStatus;
    if (!linkStatus || !LINK_STATUSES.includes(linkStatus as never)) {
      linkStatus = duplicateOutcome === "blocked" ? "rejected" : duplicateOutcome === "manual_review_required" ? "pending" : "active";
    }

    const link = await prisma.propertyIdentityLink.create({
      data: {
        propertyIdentityId: id,
        listingId,
        listingType,
        linkedByUserId: userId,
        linkStatus,
      },
    });

    if (linkStatus === "active" && listingType === "short_term_rental") {
      await prisma.shortTermListing.update({
        where: { id: listingId },
        data: { propertyIdentityId: id },
      });
    }

    await recordEvent(id, "listing_linked", { link_id: link.id, listing_id: listingId, listing_type: listingType }, userId);

    return Response.json({
      link_id: link.id,
      link_status: link.linkStatus,
      duplicate_outcome: duplicateOutcome,
    });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Link failed" },
      { status: 500 }
    );
  }
}
