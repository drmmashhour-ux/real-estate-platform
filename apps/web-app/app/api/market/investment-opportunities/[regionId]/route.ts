import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getInvestmentOpportunities } from "@/lib/market-intelligence";

/**
 * GET /api/market/investment-opportunities/:regionId
 * Query: limit
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ regionId: string }> }
) {
  try {
    await getGuestId();
    const { regionId } = await context.params;
    const limit = Number(new URL(_request.url).searchParams.get("limit")) || 50;
    const opportunities = await getInvestmentOpportunities(regionId, { limit });
    return Response.json({ opportunities });
  } catch (e) {
    return Response.json({ error: "Failed to load investment opportunities" }, { status: 500 });
  }
}
