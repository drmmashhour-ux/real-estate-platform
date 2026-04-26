import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

/**
 * GET /api/property-identity/:id
 * Returns property identity details (for owner of a linked listing or admin).
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

    const { id } = await context.params;
    const identity = await prisma.propertyIdentity.findUnique({
      where: { id },
      include: {
        links: { orderBy: { createdAt: "desc" }, take: 20 },
        verifications: { orderBy: { createdAt: "desc" }, take: 20 },
        owners: { where: { isCurrent: true } },
        riskRecords: { orderBy: { lastEvaluatedAt: "desc" }, take: 1 },
      },
    });

    if (!identity) {
      return Response.json({ error: "Property identity not found" }, { status: 404 });
    }

    const canAccess =
      identity.links.some((l) => l.linkedByUserId === userId) ||
      (await prisma.shortTermListing.findFirst({
        where: { propertyIdentityId: id, ownerId: userId },
        select: { id: true },
      }));
    if (!canAccess) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }

    return Response.json({
      id: identity.id,
      property_uid: identity.propertyUid,
      cadastre_number: identity.cadastreNumber,
      official_address: identity.officialAddress,
      normalized_address: identity.normalizedAddress,
      municipality: identity.municipality,
      province: identity.province,
      country: identity.country,
      postal_code: identity.postalCode,
      latitude: identity.latitude,
      longitude: identity.longitude,
      property_type: identity.propertyType,
      verification_score: identity.verificationScore,
      created_at: identity.createdAt,
      updated_at: identity.updatedAt,
      links: identity.links.map((l) => ({
        id: l.id,
        listing_id: l.listingId,
        listing_type: l.listingType,
        link_status: l.linkStatus,
        created_at: l.createdAt,
      })),
      verifications: identity.verifications.map((v) => ({
        id: v.id,
        verification_type: v.verificationType,
        verification_status: v.verificationStatus,
        verified_at: v.verifiedAt,
        created_at: v.createdAt,
      })),
      owners: identity.owners.map((o) => ({
        owner_name: o.ownerName,
        owner_source: o.ownerSource,
        is_current: o.isCurrent,
      })),
      risk: identity.riskRecords[0]
        ? {
            risk_score: identity.riskRecords[0].riskScore,
            risk_level: identity.riskRecords[0].riskLevel,
            last_evaluated_at: identity.riskRecords[0].lastEvaluatedAt,
          }
        : null,
    });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to fetch property identity" },
      { status: 500 }
    );
  }
}
