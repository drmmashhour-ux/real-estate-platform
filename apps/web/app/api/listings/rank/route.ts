import { NextResponse } from "next/server";
import { z } from "zod";
import { engineFlags } from "@/config/feature-flags";
import { requireRole } from "@/lib/auth/require-role";
import { logRankingAudit } from "@/lib/marketplace-ranking/ranking-audit";
import {
  rankListingsAlgorithm,
  type RankableListingInput,
} from "@/lib/marketplace-ranking/ranking-algorithm.engine";
import type { RankingContext } from "@/lib/marketplace-ranking/ranking.types";
import { persistListingRankScoreRows } from "@/lib/marketplace-ranking/persist-listing-rank-scores";

export const dynamic = "force-dynamic";

const contextSchema = z.object({
  userId: z.string().nullable().optional(),
  searchQuery: z.string().nullable().optional(),
  filtersJson: z.record(z.string(), z.unknown()),
  mapBoundsJson: z.record(z.string(), z.unknown()).nullable().optional(),
  marketSegment: z.enum(["BUY", "RENT", "SHORT_TERM"]),
  sortIntent: z.enum(["RELEVANCE", "PRICE", "NEWEST"]),
});

const bodySchema = z.object({
  context: contextSchema,
  listings: z.array(z.record(z.string(), z.unknown())).min(1).max(200),
  persist: z.boolean().optional(),
  cohort: z.string().nullable().optional(),
});

/**
 * POST /api/listings/rank — internal batch ranking (broker/admin). Explainable scores + optional persistence.
 */
export async function POST(req: Request) {
  const auth = await requireRole("broker");
  if (!auth.ok) return auth.response;

  if (!engineFlags.listingMarketplaceRankAlgorithmV1) {
    return NextResponse.json({ ok: false, error: "feature_disabled" }, { status: 404 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, details: parsed.error.flatten() }, { status: 400 });
  }

  const { context, listings, persist, cohort } = parsed.data;
  const ctx = context as RankingContext;

  const { ranked, contextHash, weightsPresetKey } = rankListingsAlgorithm(
    ctx,
    listings as RankableListingInput[],
    { cohort: cohort ?? undefined },
  );

  if (persist) {
    await persistListingRankScoreRows(
      ranked.map((r) => ({ listingId: r.listing.id, breakdown: r.breakdown })),
      contextHash,
    );
  }

  void logRankingAudit({
    ownerId: auth.user.id,
    actorId: auth.user.id,
    actionType: "ranking_generated",
    summary: `Ranked ${ranked.length} listings (weights: ${weightsPresetKey})`,
    details: { contextHash, persist: Boolean(persist), cohort: cohort ?? null },
  }).catch(() => null);

  if (cohort && cohort.trim() !== "" && cohort !== "baseline") {
    void logRankingAudit({
      ownerId: auth.user.id,
      actorId: auth.user.id,
      actionType: "experiment_applied",
      summary: `Ranking cohort override: ${cohort}`,
      details: { cohort, envCohort: process.env.RANKING_ALGO_COHORT ?? null },
    }).catch(() => null);
  }

  return NextResponse.json({
    ok: true,
    contextHash,
    weightsPresetKey,
    ranked: ranked.map((r) => ({
      listingId: r.listing.id,
      totalScore: r.totalScore,
      breakdown: r.breakdown,
    })),
  });
}
