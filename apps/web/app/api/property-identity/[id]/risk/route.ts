import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getPropertyIdentityRisk } from "@/lib/property-identity/risk";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

/**
 * GET /api/property-identity/:id/risk
 * Returns current risk record for the property identity.
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

    const risk = await getPropertyIdentityRisk(id);
    if (!risk) {
      return Response.json({ risk: null });
    }

    return Response.json({
      risk: {
        risk_score: risk.riskScore,
        risk_level: risk.riskLevel,
        risk_reasons: risk.riskReasons,
        last_evaluated_at: risk.lastEvaluatedAt,
      },
    });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to fetch risk" },
      { status: 500 }
    );
  }
}
