import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { submitComplaint } from "@/lib/trust-safety/dispute-service";
import { DISPUTE_COMPLAINT_CATEGORIES } from "@/lib/trust-safety/constants";
import type { ComplaintCategory } from "@/lib/trust-safety/constants";

/**
 * POST /api/bnhub/bookings/:bookingId/report-issue
 * Guest reports an issue within 24h of check-in. Freezes host payout and opens dispute.
 * Body: { description: string, complaintCategory: ComplaintCategory, evidenceUrls?: string[] }
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const guestId = await getGuestId();
    if (!guestId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const complaintCategory = body.complaintCategory as ComplaintCategory | undefined;
    const evidenceUrls = Array.isArray(body.evidenceUrls) ? body.evidenceUrls : [];

    if (!description) {
      return Response.json({ error: "description required" }, { status: 400 });
    }
    if (!complaintCategory || !DISPUTE_COMPLAINT_CATEGORIES.includes(complaintCategory)) {
      return Response.json(
        { error: "complaintCategory required and must be one of: " + DISPUTE_COMPLAINT_CATEGORIES.join(", ") },
        { status: 400 }
      );
    }

    const result = await submitComplaint({
      bookingId: id,
      claimantUserId: guestId,
      description,
      complaintCategory,
      evidenceUrls: evidenceUrls.length ? evidenceUrls : undefined,
    });

    return Response.json({
      disputeId: result.disputeId,
      payoutFrozen: result.payoutFrozen,
      message: "Complaint submitted. Host payout is frozen until the dispute is resolved.",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to submit complaint";
    return Response.json({ error: message }, { status: 400 });
  }
}
