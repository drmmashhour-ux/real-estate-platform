import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getBnhubIndex } from "@/lib/market-intelligence";

/**
 * GET /api/market/bnhub-index/:regionId
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
    const rows = await getBnhubIndex(regionId, { limit });
    return Response.json({ bnhubIndex: rows });
  } catch (e) {
    return Response.json({ error: "Failed to load BNHub index" }, { status: 500 });
  }
}
