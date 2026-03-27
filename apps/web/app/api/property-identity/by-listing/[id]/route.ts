import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

/**
 * GET /api/property-identity/by-listing/:id
 * Query: listing_type (optional, default short_term_rental for BNHub).
 * Returns property identity linked to this listing.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const { id: listingId } = await context.params;
    const { searchParams } = new URL(request.url);
    const listingType = searchParams.get("listing_type") || "short_term_rental";

    if (listingType === "short_term_rental") {
      const listing = await prisma.shortTermListing.findUnique({
        where: { id: listingId },
        select: { ownerId: true, propertyIdentityId: true, propertyIdentity: true },
      });
      if (!listing) {
        return Response.json({ error: "Listing not found" }, { status: 404 });
      }
      if (listing.ownerId !== userId) {
        return Response.json({ error: "Access denied" }, { status: 403 });
      }
      if (!listing.propertyIdentityId || !listing.propertyIdentity) {
        return Response.json({ property_identity: null, link: null });
      }
      const pid = listing.propertyIdentity;
      return Response.json({
        property_identity: {
          id: pid.id,
          property_uid: pid.propertyUid,
          cadastre_number: pid.cadastreNumber,
          official_address: pid.officialAddress,
          municipality: pid.municipality,
          province: pid.province,
          verification_score: pid.verificationScore,
        },
        link: { listing_type: listingType, linked: true },
      });
    }

    const link = await prisma.propertyIdentityLink.findFirst({
      where: { listingId, listingType },
      include: { propertyIdentity: true },
    });
    if (!link) {
      return Response.json({ property_identity: null, link: null });
    }
    if (link.linkedByUserId !== userId) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }

    return Response.json({
      property_identity: {
        id: link.propertyIdentity.id,
        property_uid: link.propertyIdentity.propertyUid,
        cadastre_number: link.propertyIdentity.cadastreNumber,
        official_address: link.propertyIdentity.officialAddress,
        municipality: link.propertyIdentity.municipality,
        province: link.propertyIdentity.province,
        verification_score: link.propertyIdentity.verificationScore,
      },
      link: { id: link.id, link_status: link.linkStatus, listing_type: link.listingType },
    });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to fetch" },
      { status: 500 }
    );
  }
}
