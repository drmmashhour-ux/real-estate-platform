import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import {
  recomputeAllRankingScores,
  recomputeRankingForCity,
  recomputeRankingForListing,
} from "@/src/modules/ranking/rankingService";
import {
  RANKING_LISTING_TYPE_BNHUB,
  RANKING_LISTING_TYPE_REAL_ESTATE,
  type RankingListingType,
} from "@/src/modules/ranking/dataMap";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    /* empty */
  }
  const o = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const scope = typeof o.scope === "string" ? o.scope : "all";
  const listingType = (typeof o.listingType === "string" ? o.listingType : "") as RankingListingType;
  const city = typeof o.city === "string" ? o.city : "";
  const listingId = typeof o.listingId === "string" ? o.listingId : "";

  try {
    if (scope === "listing" && listingId && listingType) {
      const row = await recomputeRankingForListing(listingType, listingId, { city: city || undefined });
      return NextResponse.json({ ok: true, result: row });
    }
    if (scope === "city" && city && listingType) {
      const n = await recomputeRankingForCity(listingType, city, 300);
      return NextResponse.json({ ok: true, updated: n });
    }
    const out = await recomputeAllRankingScores(
      listingType === RANKING_LISTING_TYPE_BNHUB || listingType === RANKING_LISTING_TYPE_REAL_ESTATE
        ? listingType
        : undefined
    );
    return NextResponse.json({ ok: true, ...out });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Recompute failed" },
      { status: 500 }
    );
  }
}
