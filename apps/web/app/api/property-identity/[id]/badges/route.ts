import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getPropertyBadges } from "@/lib/property-identity/badges";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

/**
 * GET /api/property-identity/:id/badges
 * Returns trust badges, verification score and level, risk level.
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
      select: { id: true, links: { select: { linkedByUserId: true } } },
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

    const result = await getPropertyBadges(id);
    return Response.json({
      badges: result.badges,
      verification_score: result.verificationScore,
      verification_level: result.verificationLevel,
      risk_level: result.riskLevel,
    });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to fetch badges" },
      { status: 500 }
    );
  }
}
