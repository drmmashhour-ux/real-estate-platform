import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { resolveDispute } from "@/lib/trust-safety/dispute-service";
import { DISPUTE_RESOLUTION_OUTCOMES } from "@/lib/trust-safety/constants";
import type { ResolutionOutcome } from "@/lib/trust-safety/constants";

/**
 * POST /api/admin/disputes/:id/resolve
 * Admin resolves a dispute with outcome, optional refund, and notes.
 * Body: { resolutionOutcome: ResolutionOutcome, refundCents?: number, resolutionNotes?: string }
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedBy = await getGuestId();
    if (!resolvedBy) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }
    // In production: restrict to admin role

    const { id: disputeId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const resolutionOutcome = body.resolutionOutcome as ResolutionOutcome | undefined;
    const refundCents = typeof body.refundCents === "number" ? body.refundCents : null;
    const resolutionNotes = typeof body.resolutionNotes === "string" ? body.resolutionNotes.trim() || null : null;

    if (!resolutionOutcome || !DISPUTE_RESOLUTION_OUTCOMES.includes(resolutionOutcome)) {
      return Response.json(
        { error: "resolutionOutcome required and must be one of: " + DISPUTE_RESOLUTION_OUTCOMES.join(", ") },
        { status: 400 }
      );
    }

    await resolveDispute({
      disputeId,
      resolvedBy,
      resolutionOutcome,
      refundCents: refundCents ?? undefined,
      resolutionNotes: resolutionNotes ?? undefined,
    });

    return Response.json({ success: true, message: "Dispute resolved." });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to resolve dispute";
    return Response.json({ error: message }, { status: 400 });
  }
}
