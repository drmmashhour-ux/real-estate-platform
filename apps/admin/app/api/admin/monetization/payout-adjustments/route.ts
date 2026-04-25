import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { listPayoutAdjustments } from "@/lib/monetization";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/monetization/payout-adjustments
 * Query: bookingId?, from (ISO date), to (ISO date), limit?
 * In production, restrict to admin role.
 */
export async function GET(request: NextRequest) {
  try {
    await getGuestId();
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get("bookingId") ?? undefined;
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const limit = Math.min(Number(searchParams.get("limit")) || 100, 500);

    const adjustments = await listPayoutAdjustments({
      bookingId,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      limit,
    });
    return Response.json({ adjustments });
  } catch (e) {
    return Response.json({ error: "Failed to load payout adjustments" }, { status: 500 });
  }
}
