import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { resolveIncident } from "@/lib/trust-safety/incident-service";

/**
 * POST /api/trust-safety/incidents/:id/resolve
 * Body: { resolutionNotes?: string }. Admin/support only in production.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedBy = await getGuestId();
    if (!resolvedBy) return Response.json({ error: "Sign in required" }, { status: 401 });

    const { id: incidentId } = await context.params;
    const body = await request.json().catch(() => ({}));
    await resolveIncident({
      incidentId,
      resolvedBy,
      resolutionNotes: body?.resolutionNotes ?? undefined,
    });
    return Response.json({ success: true, status: "RESOLVED" });
  } catch (e) {
    return Response.json({ error: "Failed to resolve" }, { status: 400 });
  }
}
