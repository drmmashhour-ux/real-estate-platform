import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getRegion } from "@/lib/market-intelligence";

/**
 * GET /api/market/regions/:id (id = regionId)
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await getGuestId();
    const { id: regionId } = await context.params;
    const region = await getRegion(regionId);
    if (!region) return Response.json({ error: "Region not found" }, { status: 404 });
    return Response.json(region);
  } catch (e) {
    return Response.json({ error: "Failed to load region" }, { status: 500 });
  }
}
