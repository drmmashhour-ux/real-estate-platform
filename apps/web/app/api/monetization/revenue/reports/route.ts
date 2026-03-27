import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getRevenueReports } from "@/lib/monetization";

/**
 * GET /api/monetization/revenue/reports
 * Query: from (ISO date), to (ISO date), marketId?, revenueType?, limit?, offset?
 */
export async function GET(request: NextRequest) {
  try {
    await getGuestId();
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const marketId = searchParams.get("marketId") ?? undefined;
    const revenueType = searchParams.get("revenueType") ?? undefined;
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");
    const result = await getRevenueReports({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      marketId,
      revenueType,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
    return Response.json(result);
  } catch (e) {
    return Response.json({ error: "Failed to load revenue reports" }, { status: 500 });
  }
}
