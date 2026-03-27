import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getDailyDealFeed } from "@/src/modules/daily-deal-feed/application/getDailyDealFeed";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const limit = Number(new URL(req.url).searchParams.get("limit") ?? "24");
  const feed = await getDailyDealFeed({ userId, limit: Number.isFinite(limit) ? limit : 24 });
  return NextResponse.json({ feed });
}
