import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getMarket } from "@/lib/property-graph/graph-service";

/**
 * GET /api/property-graph/market/:marketId
 * marketId can be UUID or slug (e.g. montreal-qc-ca).
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ marketId: string }> }
) {
  try {
    await getGuestId();
    const { marketId } = await context.params;
    const market = await getMarket(marketId);
    if (!market) return Response.json({ error: "Market not found" }, { status: 404 });
    return Response.json(market);
  } catch (e) {
    return Response.json({ error: "Failed to load market" }, { status: 500 });
  }
}
