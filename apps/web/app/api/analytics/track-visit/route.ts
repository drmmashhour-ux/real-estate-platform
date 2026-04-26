import { NextRequest, NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { startOfUtcDay } from "@/modules/analytics/services/get-platform-stats";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const rl = checkRateLimit(`track-visit:${ip}`, { max: 180, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: getRateLimitHeaders(rl) }
    );
  }

  const day = startOfUtcDay(new Date());

  await prisma.platformAnalytics.upsert({
    where: { date: day },
    create: {
      date: day,
      visitors: 1,
    },
    update: {
      visitors: { increment: 1 },
    },
  });

  return NextResponse.json({ ok: true }, { headers: getRateLimitHeaders(rl) });
}
