import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getRentIndex } from "@/lib/market-intelligence";

/**
 * GET /api/market/rent-index/:regionId
 * Query: limit
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ regionId: string }> }
) {
  try {
    await getGuestId();
    const { regionId } = await context.params;
    const limit = Number(new URL(_request.url).searchParams.get("limit")) || 24;
    const rows = await getRentIndex(regionId, { limit });
    return Response.json({ rentIndex: rows });
  } catch (e) {
    return Response.json({ error: "Failed to load rent index" }, { status: 500 });
  }
}
