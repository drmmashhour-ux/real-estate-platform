import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { addIncidentResponse, getIncident } from "@/lib/trust-safety/incident-service";

/**
 * POST /api/trust-safety/incidents/:id/respond
 * Body: { body: string } — response text from reporter or accused
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getGuestId();
    if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

    const { id: incidentId } = await context.params;
    const incident = await getIncident(incidentId);
    if (incident.reporterId !== userId && incident.accusedUserId !== userId) {
      return Response.json({ error: "Not authorized to respond" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const text = body?.body;
    if (!text || typeof text !== "string" || !text.trim()) {
      return Response.json({ error: "body required" }, { status: 400 });
    }

    const responseId = await addIncidentResponse({ incidentId, respondentId: userId, body: text.trim() });
    return Response.json({ responseId, message: "Response submitted." });
  } catch (e) {
    return Response.json({ error: "Failed to submit response" }, { status: 400 });
  }
}
