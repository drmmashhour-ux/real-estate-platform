import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { createIncident } from "@/lib/trust-safety/incident-service";
import { INCIDENT_CATEGORIES } from "@/lib/trust-safety/engine-constants";

/**
 * POST /api/trust-safety/incidents
 * Report an incident. Body: reporterId (or use session), accusedUserId?, listingId?, bookingId?, incidentCategory, description, incidentTime?, severityLevel?, urgencyLevel?, uploadedEvidence? (urls)
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const reporterId = body.reporterId ?? userId;
    if (reporterId !== userId) {
      return Response.json({ error: "Cannot report on behalf of another user" }, { status: 403 });
    }

    const incidentCategory = body.incidentCategory ?? "other";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    if (!description) {
      return Response.json({ error: "description required" }, { status: 400 });
    }

    const incidentTime = body.incidentTime ? new Date(body.incidentTime) : undefined;
    const { incidentId } = await createIncident({
      reporterId,
      accusedUserId: body.accusedUserId ?? undefined,
      listingId: body.listingId ?? undefined,
      bookingId: body.bookingId ?? undefined,
      incidentCategory: INCIDENT_CATEGORIES.includes(incidentCategory) ? incidentCategory : "other",
      severityLevel: body.severityLevel,
      urgencyLevel: body.urgencyLevel,
      description,
      incidentTime: incidentTime ?? undefined,
      riskScore: typeof body.riskScore === "number" ? body.riskScore : undefined,
    });

    if (Array.isArray(body.uploadedEvidence) && body.uploadedEvidence.length > 0) {
      const { addIncidentEvidence } = await import("@/lib/trust-safety/incident-service");
      for (const item of body.uploadedEvidence) {
        const url = typeof item === "string" ? item : item?.url;
        if (url) await addIncidentEvidence({ incidentId, fileUrl: url, fileType: item?.fileType, uploadedBy: userId });
      }
    }

    return Response.json({ incidentId, message: "Incident reported." });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to report incident";
    return Response.json({ error: message }, { status: 400 });
  }
}
