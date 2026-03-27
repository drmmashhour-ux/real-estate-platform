import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getRevenueReports } from "@/lib/monetization";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/monetization/revenue
 * Query: from, to, marketId?, revenueType?, limit?, offset?
 * In production, restrict to admin role.
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
      limit: limit ? Number(limit) : 500,
      offset: offset ? Number(offset) : 0,
    });
    return Response.json(result);
  } catch (e) {
    return Response.json({ error: "Failed to load revenue" }, { status: 500 });
  }
}
