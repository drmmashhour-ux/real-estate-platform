import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getRentIndex } from "@/lib/market-intelligence";

/**
 * GET /api/market/rent-index/:id (id = regionId). Query: limit
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await getGuestId();
    const { id: regionId } = await context.params;
    const limit = Number(new URL(_request.url).searchParams.get("limit")) || 24;
    const rows = await getRentIndex(regionId, { limit });
    return Response.json({ rentIndex: rows });
  } catch (e) {
    return Response.json({ error: "Failed to load rent index" }, { status: 500 });
  }
}
