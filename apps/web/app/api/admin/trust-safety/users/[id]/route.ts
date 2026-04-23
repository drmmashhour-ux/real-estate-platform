import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getUserSafetyProfile, computeHostRiskLevel } from "@/lib/trust-safety/safety-profile-service";
import { prisma } from "@repo/db";

/**
 * GET /api/admin/trust-safety/users/:id (id = userId)
 * User safety profile, risk level, and recent incidents.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await getGuestId();
    const { id: userId } = await context.params;

    const [profile, risk, incidentsAsAccused, incidentsAsReporter] = await Promise.all([
      getUserSafetyProfile(userId),
      computeHostRiskLevel(userId),
      prisma.trustSafetyIncident.findMany({
        where: { accusedUserId: userId },
        take: 20,
        orderBy: { createdAt: "desc" },
        select: { id: true, incidentCategory: true, severityLevel: true, status: true, createdAt: true },
      }),
      prisma.trustSafetyIncident.findMany({
        where: { reporterId: userId },
        take: 10,
        orderBy: { createdAt: "desc" },
        select: { id: true, incidentCategory: true, status: true, createdAt: true },
      }),
    ]);

    return Response.json({
      profile,
      hostRisk: risk,
      incidentsAsAccused,
      incidentsAsReporter,
    });
  } catch (e) {
    return Response.json({ error: "Failed to fetch user safety profile" }, { status: 500 });
  }
}
