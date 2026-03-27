import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { refreshDailyDealFeed } from "@/src/modules/daily-deal-feed/application/refreshDailyDealFeed";

export const dynamic = "force-dynamic";

export async function POST() {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const feed = await refreshDailyDealFeed({ userId });
  return NextResponse.json({ ok: true, feed });
}
