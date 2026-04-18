import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { addToWatchlist } from "@/src/modules/watchlist-alerts/application/addToWatchlist";
import { isReasonableListingId } from "@/lib/api/safe-params";

export async function POST(req: Request) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const listingId = typeof body?.listingId === "string" ? body.listingId.trim() : "";
  if (!listingId || !isReasonableListingId(listingId)) {
    return NextResponse.json({ error: "listingId required" }, { status: 400 });
  }
  const out = await addToWatchlist({ userId, listingId });
  return NextResponse.json({ ok: true, created: out.created });
}
