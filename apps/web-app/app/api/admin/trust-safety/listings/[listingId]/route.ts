import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getListingSafetyProfile, computeListingSafetyScore } from "@/lib/trust-safety/safety-profile-service";
import { prisma } from "@/lib/db";

/**
 * GET /api/admin/trust-safety/listings/:listingId
 * Listing safety profile and recent incidents.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ listingId: string }> }
) {
  try {
    await getGuestId();
    const { listingId } = await context.params;

    const [profile, safetyScore, incidents] = await Promise.all([
      getListingSafetyProfile(listingId),
      computeListingSafetyScore(listingId),
      prisma.trustSafetyIncident.findMany({
        where: { listingId },
        take: 20,
        orderBy: { createdAt: "desc" },
        select: { id: true, incidentCategory: true, severityLevel: true, status: true, createdAt: true },
      }),
    ]);

    return Response.json({
      profile,
      safetyScore,
      incidents,
    });
  } catch (e) {
    return Response.json({ error: "Failed to fetch listing safety profile" }, { status: 500 });
  }
}
