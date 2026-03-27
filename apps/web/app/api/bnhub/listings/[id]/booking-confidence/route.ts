import { NextRequest } from "next/server";
import { generateBookingConfidence } from "@/lib/bnhub/booking-confidence";
import { getGuestId } from "@/lib/auth/session";

/**
 * GET /api/bnhub/listings/:id/booking-confidence
 * Optional: uses session guest for profile hint when signed in.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const guestFromQuery = request.nextUrl.searchParams.get("guestUserId");
    const sessionGuest = await getGuestId().catch(() => null);
    const guestUserId = guestFromQuery ?? sessionGuest ?? undefined;
    const result = await generateBookingConfidence(id, guestUserId ?? null);
    return Response.json({
      level: result.level,
      score: result.score,
      reasons: result.reasons,
      guest_trust_hint: result.guestTrustHint ?? null,
    });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Not found" },
      { status: 404 }
    );
  }
}
