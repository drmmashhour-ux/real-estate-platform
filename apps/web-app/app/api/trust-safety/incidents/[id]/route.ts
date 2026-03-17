import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getIncident } from "@/lib/trust-safety/incident-service";

/**
 * GET /api/trust-safety/incidents/:id
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getGuestId();
    if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

    const { id } = await context.params;
    const incident = await getIncident(id);
    if (incident.reporterId !== userId && incident.accusedUserId !== userId) {
      return Response.json({ error: "Not authorized to view this incident" }, { status: 403 });
    }
    return Response.json(incident);
  } catch (e) {
    return Response.json({ error: "Incident not found" }, { status: 404 });
  }
}
