import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { listWatchlistAlerts } from "@/src/modules/watchlist-alerts/infrastructure/watchlistAlertRepository";

export async function GET() {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const alerts = await listWatchlistAlerts({ userId, limit: 100 });
  return NextResponse.json({ alerts });
}
