import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { submitAppeal } from "@/lib/trust-safety/appeals-service";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

/**
 * POST /api/trust-safety/appeals
 * Body: { incidentId: string, actionId?: string, appealReason: string }
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const incidentId = body?.incidentId;
    const appealReason = typeof body?.appealReason === "string" ? body.appealReason.trim() : "";
    if (!incidentId) return Response.json({ error: "incidentId required" }, { status: 400 });
    if (!appealReason) return Response.json({ error: "appealReason required" }, { status: 400 });

    const incident = await prisma.trustSafetyIncident.findUniqueOrThrow({
      where: { id: incidentId },
      select: { reporterId: true, accusedUserId: true },
    });
    if (incident.reporterId !== userId && incident.accusedUserId !== userId) {
      return Response.json({ error: "Not authorized to appeal this incident" }, { status: 403 });
    }

    const { appealId } = await submitAppeal({
      incidentId,
      actionId: body?.actionId,
      submittedBy: userId,
      appealReason,
    });
    return Response.json({ appealId, message: "Appeal submitted." });
  } catch (e) {
    return Response.json({ error: "Failed to submit appeal" }, { status: 400 });
  }
}
