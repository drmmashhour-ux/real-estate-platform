import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { createIncident } from "@/lib/trust-safety/incident-service";

/**
 * POST /api/trust-safety/messages/report
 * Report a conversation or message (message_abuse). Body: accusedUserId, listingId?, bookingId?, description, messageId?, messageExcerpt?
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const description = typeof body.description === "string" ? body.description.trim() : "";
    if (!description) return Response.json({ error: "description required" }, { status: 400 });

    const { incidentId } = await createIncident({
      reporterId: userId,
      accusedUserId: body.accusedUserId ?? undefined,
      listingId: body.listingId ?? undefined,
      bookingId: body.bookingId ?? undefined,
      incidentCategory: "message_abuse",
      severityLevel: body.severityLevel ?? "MEDIUM",
      urgencyLevel: body.urgencyLevel,
      description: body.messageExcerpt ? `${description}\n\nMessage excerpt: ${body.messageExcerpt}` : description,
      incidentTime: body.incidentTime ? new Date(body.incidentTime) : undefined,
    });

    return Response.json({ incidentId, message: "Report submitted." });
  } catch (e) {
    return Response.json({ error: "Failed to submit report" }, { status: 400 });
  }
}
