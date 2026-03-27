import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getPropertyBadges } from "@/lib/property-identity/badges";

/**
 * GET /api/admin/property-identities/:id
 * Full detail for admin Property Identity Console.
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
        links: { orderBy: { createdAt: "desc" } },
        verifications: { orderBy: { createdAt: "desc" } },
        owners: { orderBy: { createdAt: "desc" } },
        riskRecords: { orderBy: { lastEvaluatedAt: "desc" }, take: 5 },
        events: { orderBy: { createdAt: "desc" }, take: 50 },
      },
    });

    if (!identity) {
      return Response.json({ error: "Property identity not found" }, { status: 404 });
    }

    const badges = await getPropertyBadges(id);

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
        linked_by_user_id: l.linkedByUserId,
        created_at: l.createdAt,
      })),
      verifications: identity.verifications.map((v) => ({
        id: v.id,
        verification_type: v.verificationType,
        verification_status: v.verificationStatus,
        verified_by: v.verifiedBy,
        verified_at: v.verifiedAt,
        created_at: v.createdAt,
      })),
      owners: identity.owners.map((o) => ({
        id: o.id,
        owner_name: o.ownerName,
        owner_source: o.ownerSource,
        is_current: o.isCurrent,
        created_at: o.createdAt,
      })),
      risk_records: identity.riskRecords.map((r) => ({
        risk_score: r.riskScore,
        risk_level: r.riskLevel,
        risk_reasons: r.riskReasons,
        last_evaluated_at: r.lastEvaluatedAt,
      })),
      events: identity.events.map((e) => ({
        id: e.id,
        event_type: e.eventType,
        event_data: e.eventData,
        created_by: e.createdBy,
        created_at: e.createdAt,
      })),
      badges: badges.badges,
      verification_level: badges.verificationLevel,
    });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to fetch" },
      { status: 500 }
    );
  }
}
