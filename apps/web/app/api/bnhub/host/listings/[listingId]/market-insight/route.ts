import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getBnhubMarketInsightForListing } from "@/lib/bnhub/market-price-insight";

export const dynamic = "force-dynamic";

/**
 * Host-only: market comparison vs BNHub peers + optional AI-polished copy.
 * Works for draft or published listings owned by the caller.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ listingId: string }> }
) {
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }

  try {
    const { listingId } = await context.params;
    const id = decodeURIComponent(listingId ?? "").trim();
    if (!id) {
      return Response.json({ error: "listingId required" }, { status: 400 });
    }

    const insight = await getBnhubMarketInsightForListing(id, {
      hostUserId: userId,
      useAi: true,
    });
    if (!insight) {
      return Response.json({ error: "Listing not found" }, { status: 404 });
    }

    return Response.json(insight);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to load market insight" }, { status: 500 });
  }
}
