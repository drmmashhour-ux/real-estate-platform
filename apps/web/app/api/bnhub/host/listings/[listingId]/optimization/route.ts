import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getListingOptimizationForHost } from "@/lib/bnhub/listing-optimization";

export const dynamic = "force-dynamic";

/**
 * Host-only: performance score + concrete improvement suggestions (title, photos, price).
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

    const payload = await getListingOptimizationForHost(id, userId);
    if (!payload) {
      return Response.json({ error: "Listing not found" }, { status: 404 });
    }

    return Response.json(payload);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to load optimization" }, { status: 500 });
  }
}
