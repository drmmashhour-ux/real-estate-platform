import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { escalateIncident } from "@/lib/trust-safety/incident-service";

/**
 * POST /api/trust-safety/incidents/:id/escalate
 * Escalate to trust & safety. Support/admin or reporter.
 */
export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getGuestId();
    if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

    const { id: incidentId } = await context.params;
    await escalateIncident(incidentId, userId);
    return Response.json({ success: true, status: "ESCALATED" });
  } catch (e) {
    return Response.json({ error: "Failed to escalate" }, { status: 400 });
  }
}
