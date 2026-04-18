import { NextRequest } from "next/server";
import {
  cronNotConfigured,
  cronUnauthorized,
  verifyCronBearer,
} from "@/lib/server/internal-cron-auth";
import { recomputeAllRankingScores, recomputeRankingForCity } from "@/src/modules/ranking/rankingService";
import { RANKING_LISTING_TYPE_BNHUB, RANKING_LISTING_TYPE_REAL_ESTATE } from "@/src/modules/ranking/dataMap";
import { engineFlags } from "@/config/feature-flags";

export const dynamic = "force-dynamic";

/**
 * POST /api/internal/ranking/recalculate — nightly-style batch (Bearer CRON_SECRET).
 * Body: { listingType?: "bnhub" | "real_estate", city?: string, limit?: number }
 */
export async function POST(request: NextRequest) {
  if (!process.env.CRON_SECRET?.trim()) return cronNotConfigured();
  if (!verifyCronBearer(request)) return cronUnauthorized();
  if (!engineFlags.rankingV1) {
    return Response.json({ ok: false, error: "FEATURE_RANKING_V1 disabled" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    listingType?: "bnhub" | "real_estate";
    city?: string;
    limit?: number;
  };

  if (body.city?.trim()) {
    const lt =
      body.listingType === "bnhub" ? RANKING_LISTING_TYPE_BNHUB : RANKING_LISTING_TYPE_REAL_ESTATE;
    const n = await recomputeRankingForCity(lt, body.city.trim(), Math.min(500, body.limit ?? 200));
    return Response.json({ ok: true, mode: "city", processed: n });
  }

  const batch = await recomputeAllRankingScores(
    body.listingType === "bnhub"
      ? RANKING_LISTING_TYPE_BNHUB
      : body.listingType === "real_estate"
        ? RANKING_LISTING_TYPE_REAL_ESTATE
        : undefined
  );
  return Response.json({ ok: true, mode: "batch", ...batch });
}
