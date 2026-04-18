import { NextRequest, NextResponse } from "next/server";
import { engineFlags } from "@/config/feature-flags";
import { getGuestId } from "@/lib/auth/session";
import { getRecommendationsForBrowse } from "@/src/modules/recommendations/recommendation.service";
import { trendingStrategy } from "@/src/modules/recommendations/strategies/trending.strategy";

export const dynamic = "force-dynamic";

/**
 * GET /api/listings/recommendations?city=Montreal
 * Headers: x-session-id (optional, max 128 chars)
 * Query: mode=browse|trending — browse composes trending + saved + high-value + recent updates when flags allow.
 */
export async function GET(req: NextRequest) {
  if (!engineFlags.recommendationsV1) {
    return NextResponse.json({ ok: true, blocks: [] });
  }
  const city = req.nextUrl.searchParams.get("city")?.trim() || undefined;
  const mode = req.nextUrl.searchParams.get("mode")?.trim().toLowerCase() ?? "browse";
  const sessionId = req.headers.get("x-session-id")?.trim().slice(0, 128) ?? null;
  const userId = await getGuestId().catch(() => null);

  if (mode === "trending") {
    const block = await trendingStrategy({ city: city ?? null, excludeIds: [], limit: 12, sessionId, userId });
    return NextResponse.json({ ok: true, blocks: block ? [block] : [] });
  }

  const blocks = await getRecommendationsForBrowse({
    city: city ?? null,
    sessionId,
    userId,
    excludeIds: [],
    limit: 12,
  });
  return NextResponse.json({ ok: true, blocks });
}
