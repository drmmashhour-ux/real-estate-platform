import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { addIncidentEvidence, getIncident } from "@/lib/trust-safety/incident-service";
import { EVIDENCE_FILE_TYPES } from "@/lib/trust-safety/engine-constants";

/**
 * POST /api/trust-safety/incidents/:id/evidence
 * Body: { fileUrl: string, fileType?: string, label?: string }
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
      return Response.json({ error: "Not authorized" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const fileUrl = body?.fileUrl;
    if (!fileUrl || typeof fileUrl !== "string") {
      return Response.json({ error: "fileUrl required" }, { status: 400 });
    }
    const fileType = body?.fileType && EVIDENCE_FILE_TYPES.includes(body.fileType) ? body.fileType : undefined;
    const evidenceId = await addIncidentEvidence({
      incidentId,
      fileUrl,
      fileType,
      label: body?.label,
      uploadedBy: userId,
    });
    return Response.json({ evidenceId });
  } catch (e) {
    return Response.json({ error: "Failed to add evidence" }, { status: 400 });
  }
}
