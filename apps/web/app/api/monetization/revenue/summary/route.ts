import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getRevenueSummary } from "@/lib/monetization";

/**
 * GET /api/monetization/revenue/summary
 * Query: from (ISO date), to (ISO date), marketId?
 * Admin or internal only in production.
 */
export async function GET(request: NextRequest) {
  try {
    await getGuestId();
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const marketId = searchParams.get("marketId") ?? undefined;
    const summary = await getRevenueSummary({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      marketId,
    });
    return Response.json(summary);
  } catch (e) {
    return Response.json({ error: "Failed to load revenue summary" }, { status: 500 });
  }
}
