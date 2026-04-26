import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { createOrLink } from "@/lib/property-identity/create-or-link";
import { LISTING_TYPES } from "@/lib/property-identity/constants";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

/**
 * POST /api/property-identity/create-or-link
 * Body: listingId, listingType, cadastreNumber?, officialAddress, municipality?, province?, country?, postalCode?, latitude?, longitude?, propertyType?
 * Creates or finds property identity and links the listing. Returns propertyIdentityId, linkStatus, duplicateOutcome.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const listingId = body.listingId as string;
    const listingType = body.listingType as string;

    if (!listingId || !body.officialAddress) {
      return Response.json(
        { error: "listingId and officialAddress are required" },
        { status: 400 }
      );
    }

    if (!listingType || !LISTING_TYPES.includes(listingType as "sale" | "long_term_rental" | "short_term_rental")) {
      return Response.json(
        { error: "listingType must be one of: sale, long_term_rental, short_term_rental" },
        { status: 400 }
      );
    }

    if (listingType === "short_term_rental") {
      const listing = await prisma.shortTermListing.findUnique({
        where: { id: listingId },
        select: { ownerId: true },
      });
      if (!listing) {
        return Response.json({ error: "Listing not found" }, { status: 404 });
      }
      if (listing.ownerId !== userId) {
        return Response.json({ error: "Not authorized to link this listing" }, { status: 403 });
      }
    }

    const result = await createOrLink({
      listingId,
      listingType: listingType as "sale" | "long_term_rental" | "short_term_rental",
      linkedByUserId: userId,
      cadastreNumber: body.cadastreNumber ?? null,
      officialAddress: String(body.officialAddress).trim(),
      municipality: body.municipality ?? null,
      province: body.province ?? null,
      country: body.country ?? null,
      postalCode: body.postalCode ?? null,
      latitude: body.latitude != null ? Number(body.latitude) : null,
      longitude: body.longitude != null ? Number(body.longitude) : null,
      propertyType: body.propertyType ?? null,
    });

    if (result.linkStatus === "active" && listingType === "short_term_rental") {
      await prisma.shortTermListing.update({
        where: { id: listingId },
        data: { propertyIdentityId: result.propertyIdentityId },
      });
    }

    return Response.json({
      property_identity_id: result.propertyIdentityId,
      property_uid: result.propertyUid,
      link_id: result.linkId,
      link_status: result.linkStatus,
      duplicate_outcome: result.duplicateOutcome,
      is_new_identity: result.isNewIdentity,
    });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Create or link failed" },
      { status: 500 }
    );
  }
}
