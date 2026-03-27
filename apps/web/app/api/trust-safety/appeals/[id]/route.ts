import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getAppeal } from "@/lib/trust-safety/appeals-service";
import { prisma } from "@/lib/db";

/**
 * GET /api/trust-safety/appeals/:id
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getGuestId();
    if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

    const { id: appealId } = await context.params;
    const appeal = await getAppeal(appealId);
    const incident = await prisma.trustSafetyIncident.findUniqueOrThrow({
      where: { id: appeal.incidentId },
      select: { reporterId: true, accusedUserId: true },
    });
    if (incident.reporterId !== userId && incident.accusedUserId !== userId && appeal.submittedBy !== userId) {
      return Response.json({ error: "Not authorized to view this appeal" }, { status: 403 });
    }
    return Response.json(appeal);
  } catch (e) {
    return Response.json({ error: "Appeal not found" }, { status: 404 });
  }
}
