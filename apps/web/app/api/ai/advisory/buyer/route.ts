import { NextRequest } from "next/server";
import { getBuyerAdvisory } from "@/lib/ai/advisory";

export const dynamic = "force-dynamic";

/** GET /api/ai/advisory/buyer?listingId=... – risk level, price vs market, potential issues for guests. */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const listingId = searchParams.get("listingId");
  if (!listingId) {
    return Response.json({ error: "listingId required" }, { status: 400 });
  }
  try {
    const result = await getBuyerAdvisory(listingId);
    if (!result) {
      return Response.json({ error: "Listing not found or advisory unavailable" }, { status: 404 });
    }
    return Response.json(result);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Advisory failed" }, { status: 500 });
  }
}
