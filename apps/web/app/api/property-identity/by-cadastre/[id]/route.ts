import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";

/**
 * GET /api/property-identity/by-cadastre/:id
 * Returns property identity (if any) for the given cadastre number (id = encoded cadastre).
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

    const cadastreNumber = decodeURIComponent((await context.params).id);
    if (!cadastreNumber.trim()) {
      return Response.json({ error: "id (cadastre) required" }, { status: 400 });
    }

    const identity = await prisma.propertyIdentity.findFirst({
      where: { cadastreNumber: { equals: cadastreNumber.trim(), mode: "insensitive" } },
      select: {
        id: true,
        propertyUid: true,
        officialAddress: true,
        municipality: true,
        province: true,
        verificationScore: true,
        links: { select: { listingId: true, listingType: true, linkStatus: true } },
      },
    });

    if (!identity) {
      return Response.json({ property_identity: null });
    }

    return Response.json({
      property_identity: {
        id: identity.id,
        property_uid: identity.propertyUid,
        official_address: identity.officialAddress,
        municipality: identity.municipality,
        province: identity.province,
        verification_score: identity.verificationScore,
        links: identity.links,
      },
    });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to fetch" },
      { status: 500 }
    );
  }
}
