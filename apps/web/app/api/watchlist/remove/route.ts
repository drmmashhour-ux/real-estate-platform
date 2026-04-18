import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { removeFromWatchlist } from "@/src/modules/watchlist-alerts/application/removeFromWatchlist";
import { isReasonableListingId } from "@/lib/api/safe-params";

export async function POST(req: Request) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const listingId = typeof body?.listingId === "string" ? body.listingId.trim() : "";
  if (!listingId || !isReasonableListingId(listingId)) {
    return NextResponse.json({ error: "listingId required" }, { status: 400 });
  }
  const out = await removeFromWatchlist({ userId, listingId });
  return NextResponse.json({ ok: true, removed: out.removedCount });
}
