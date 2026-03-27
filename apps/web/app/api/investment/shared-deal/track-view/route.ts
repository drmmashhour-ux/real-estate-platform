import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  dealId: z.string().uuid(),
  referrerDealId: z.string().uuid().nullable().optional(),
  /** ?ru= — user id of sharer */
  referrerUserId: z.string().uuid().nullable().optional(),
  sessionId: z.string().max(64).nullable().optional(),
});

/**
 * Record a view of a public shared deal page (one row per beacon; client dedupes per session).
 */
export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const rl = checkRateLimit(`shared_deal_view:${ip}`, { max: 120, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many requests" },
      { status: 429, headers: getRateLimitHeaders(rl) }
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }

  const { dealId, referrerDealId, referrerUserId, sessionId } = parsed.data;

  try {
    const exists = await prisma.investmentDeal.findUnique({
      where: { id: dealId },
      select: { id: true },
    });
    if (!exists) {
      return NextResponse.json({ ok: false, error: "Deal not found" }, { status: 404 });
    }

    let resolvedReferrerUserId: string | null = referrerUserId ?? null;
    if (resolvedReferrerUserId) {
      const u = await prisma.user.findUnique({
        where: { id: resolvedReferrerUserId },
        select: { id: true },
      });
      if (!u) resolvedReferrerUserId = null;
    }

    await prisma.sharedDealVisit.create({
      data: {
        dealId,
        referrerDealId: referrerDealId ?? null,
        referrerUserId: resolvedReferrerUserId,
        sessionId: sessionId?.slice(0, 64) ?? null,
      },
    });

    return NextResponse.json({ ok: true }, { headers: getRateLimitHeaders(rl) });
  } catch (e) {
    console.error("[shared-deal/track-view]", e);
    return NextResponse.json(
      { ok: false, error: "Could not record" },
      { status: 500, headers: getRateLimitHeaders(rl) }
    );
  }
}
