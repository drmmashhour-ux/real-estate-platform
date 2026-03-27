import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getUserWatchlist } from "@/src/modules/watchlist-alerts/application/getUserWatchlist";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const data = await getUserWatchlist(userId);
  return NextResponse.json(data);
}
