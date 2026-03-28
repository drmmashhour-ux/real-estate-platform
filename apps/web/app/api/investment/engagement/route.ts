import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserIdFromRequest } from "@/lib/auth/api-session";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Record a completed analyze run for the logged-in user (server-side engagement).
 * Idempotent-friendly: call once per successful client analyze.
 */
export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const rl = checkRateLimit(`investment_engagement:${ip}`, {
    max: 120,
    windowMs: 60 * 60_000,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many requests." },
      { status: 429, headers: getRateLimitHeaders(rl) }
    );
  }

  const userId = await getSessionUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { id: userId },
      select: { investmentMvpFirstAnalyzeAt: true },
    });
    if (!existing) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        investmentMvpAnalyzeCount: { increment: 1 },
        ...(existing.investmentMvpFirstAnalyzeAt == null
          ? { investmentMvpFirstAnalyzeAt: new Date() }
          : {}),
      },
      select: {
        investmentMvpAnalyzeCount: true,
        investmentMvpFirstAnalyzeAt: true,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        analyzeCount: updated.investmentMvpAnalyzeCount,
        firstAnalyzeAt: updated.investmentMvpFirstAnalyzeAt?.toISOString() ?? null,
      },
      { headers: getRateLimitHeaders(rl) }
    );
  } catch (e) {
    console.error("[investment/engagement]", e);
    return NextResponse.json(
      { ok: false, error: "Could not record engagement." },
      { status: 500, headers: getRateLimitHeaders(rl) }
    );
  }
}
