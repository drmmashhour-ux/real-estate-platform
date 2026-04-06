import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { createHostReviewOfGuest } from "@/src/modules/reviews/hostReviewOfGuestService";
import { blockIfDemoWrite } from "@/lib/demo-mode-api";

/**
 * POST — Host evaluates guest after completed stay (behavior, theft/damage, checklist).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const blocked = blockIfDemoWrite(request);
  if (blocked) return blocked;

  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id: bookingId } = await params;
  const body = await request.json().catch(() => ({}));

  try {
    const row = await createHostReviewOfGuest(bookingId, userId, {
      guestRespectRating: Number(body.guestRespectRating),
      propertyCareRating:
        body.propertyCareRating != null ? Number(body.propertyCareRating) : undefined,
      checkoutComplianceRating:
        body.checkoutComplianceRating != null ? Number(body.checkoutComplianceRating) : undefined,
      quietHoursRespected:
        typeof body.quietHoursRespected === "boolean" ? body.quietHoursRespected : undefined,
      houseRulesRespected:
        typeof body.houseRulesRespected === "boolean" ? body.houseRulesRespected : undefined,
      leftPropertyReasonablyTidy:
        typeof body.leftPropertyReasonablyTidy === "boolean"
          ? body.leftPropertyReasonablyTidy
          : undefined,
      communicationReasonable:
        typeof body.communicationReasonable === "boolean"
          ? body.communicationReasonable
          : undefined,
      theftOrDamageReported: Boolean(body.theftOrDamageReported),
      incidentDetails: typeof body.incidentDetails === "string" ? body.incidentDetails : undefined,
      hostNotes: typeof body.hostNotes === "string" ? body.hostNotes : undefined,
      hostChecklistJson:
        body.hostChecklistJson && typeof body.hostChecklistJson === "object"
          ? body.hostChecklistJson
          : undefined,
    });
    return Response.json(row);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to save host evaluation";
    return Response.json({ error: msg }, { status: 400 });
  }
}
