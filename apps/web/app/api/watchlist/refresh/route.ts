import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { generateWatchlistAlerts } from "@/src/modules/watchlist-alerts/application/generateWatchlistAlerts";

export async function POST(req: Request) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const listingId = typeof body?.listingId === "string" ? body.listingId : undefined;
  const out = await generateWatchlistAlerts({ userId, listingId });
  return NextResponse.json({ ok: true, ...out });
}
