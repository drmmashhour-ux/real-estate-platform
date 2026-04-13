import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getBnhubIndex } from "@/lib/market-intelligence";

/**
 * GET /api/market/bnhub-index/:id (id = regionId). Query: limit
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await getGuestId();
    const { id: regionId } = await context.params;
    const limit = Number(new URL(_request.url).searchParams.get("limit")) || 24;
    const rows = await getBnhubIndex(regionId, { limit });
    return Response.json({ bnhubIndex: rows });
  } catch (e) {
    return Response.json({ error: "Failed to load BNHUB index" }, { status: 500 });
  }
}
