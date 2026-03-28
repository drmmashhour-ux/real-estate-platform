import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { getGuestId } from "@/lib/auth/session";
import { logRankingClick } from "@/src/modules/ranking/tracking";
import type { RankingListingType } from "@/src/modules/ranking/dataMap";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = checkRateLimit(`ranking:click:${ip}`, { windowMs: 60_000, max: 120 });
  if (!limit.allowed) {
    return NextResponse.json({ ok: false }, { status: 429, headers: getRateLimitHeaders(limit) });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const listingType = typeof o.listingType === "string" ? o.listingType : "";
  const listingId = typeof o.listingId === "string" ? o.listingId.trim() : "";
  const pageType = typeof o.pageType === "string" ? o.pageType : "search";
  const position = typeof o.position === "number" ? o.position : undefined;
  const sessionId = typeof o.sessionId === "string" ? o.sessionId.slice(0, 64) : undefined;

  if (!listingId || (listingType !== "bnhub" && listingType !== "real_estate")) {
    return NextResponse.json({ error: "listingType and listingId required" }, { status: 400 });
  }

  const userId = await getGuestId();
  await logRankingClick(listingType as RankingListingType, listingId, {
    pageType: pageType as "search",
    position,
    userId,
    sessionId,
  });

  return NextResponse.json({ ok: true });
}
