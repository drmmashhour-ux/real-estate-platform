import { AiDecisionDomain } from "@prisma/client";
import { buildListingSignalsBatch } from "@/lib/ai/core/buildListingSignals";
import { buildUserSignals } from "@/lib/ai/core/buildUserSignals";
import type { IntelligenceScores } from "@/lib/ai/core/types";
import { computeCompositeScore } from "@/lib/ai/intelligence/computeCompositeScore";
import { logIntelligenceDecision } from "@/lib/ai/intelligence/logIntelligenceDecision";
import {
  deriveAiUiLabels,
  type AiSearchFilters,
  type AiScoreBreakdown,
} from "./computeListingScore";

export type BnhubListingWithAi<Base> = Base & {
  aiScore: number;
  aiBreakdown: AiScoreBreakdown;
  aiLabels: ReturnType<typeof deriveAiUiLabels>;
};

type BnhubListingLike = Record<string, unknown> & {
  id: string;
  city: string;
  nightPriceCents: number;
  maxGuests: number;
  propertyType: string | null;
  createdAt: Date;
  amenities?: unknown;
};

type ApplyCtx = {
  filters: AiSearchFilters;
  userId?: string | null;
  /** listingId -> 0 best .. 1 worst */
  engineOrderPrior?: Map<string, number>;
  personalizationWeight?: number;
};

function hashToUnit(id: string, salt: string): number {
  let h = 0;
  const s = `${salt}:${id}`;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return (h % 10000) / 10000;
}

function mapIntelligenceToLegacyBreakdown(s: IntelligenceScores): AiScoreBreakdown {
  return {
    relevance: s.relevanceScore,
    performance: s.conversionScore,
    demand: s.demandScore,
    price: s.priceCompetitiveness,
    personalization: s.personalizationScore,
    recency: s.recencyScore,
  };
}

/**
 * Re-ranks BNHUB search results using unified intelligence (`buildListingSignals` + `computeCompositeScore`).
 */
export async function applyAiSearchRankingToBnhubResults<T extends BnhubListingLike>(
  listings: T[],
  ctx: ApplyCtx
): Promise<Array<BnhubListingWithAi<T>>> {
  if (listings.length === 0) return [];

  const ids = listings.map((l) => l.id);
  const [signalsMap, userSignals] = await Promise.all([
    buildListingSignalsBatch(ids),
    ctx.userId ? buildUserSignals(ctx.userId) : Promise.resolve(null),
  ]);

  const domain =
    ctx.personalizationWeight != null && ctx.personalizationWeight > 1.2 ? "recommendation" : "search";

  const scored = listings.map((listing, idx) => {
    const jitter = hashToUnit(listing.id, "ai-search") * 0.018;
    const signals = signalsMap.get(listing.id);
    if (!signals) {
      return {
        row: {
          ...listing,
          aiScore: 0.5 + jitter,
          aiBreakdown: mapIntelligenceToLegacyBreakdown({
            relevanceScore: 0.5,
            demandScore: 0.5,
            conversionScore: 0.5,
            priceCompetitiveness: 0.5,
            qualityScore: 0.5,
            personalizationScore: 0.5,
            recencyScore: 0.5,
            confidenceScore: 0.5,
          }),
          aiLabels: [] as ReturnType<typeof deriveAiUiLabels>,
        },
        idx,
        score: 0.5 + jitter,
      };
    }

    const prior = ctx.engineOrderPrior?.get(listing.id);
    const composite = computeCompositeScore({
      domain,
      listing: signals,
      userSignals,
      searchContext: { filters: ctx.filters },
      engineOrderPrior: prior,
    });

    let score = composite.aiCompositeScore + jitter;
    if (domain === "recommendation" && ctx.personalizationWeight != null && ctx.personalizationWeight > 1) {
      score += (composite.scores.personalizationScore - 0.5) * 0.06 * (ctx.personalizationWeight - 1);
    }

    const breakdown = mapIntelligenceToLegacyBreakdown(composite.scores);

    return {
      row: {
        ...listing,
        aiScore: score,
        aiBreakdown: breakdown,
        aiLabels: [] as ReturnType<typeof deriveAiUiLabels>,
      },
      idx,
      score,
    };
  });

  void logIntelligenceDecision({
    domain: AiDecisionDomain.SEARCH,
    actionType: "search_rank_batch",
    userId: ctx.userId ?? undefined,
    explanation: `Ranked ${listings.length} stays (domain=${domain})`,
    confidenceScore: 0.75,
    inputPayload: { count: listings.length, domain },
  }).catch(() => {});

  scored.sort((a, b) => {
    const d = b.score - a.score;
    if (Math.abs(d) > 1e-9) return d;
    return a.idx - b.idx;
  });

  const n = scored.length;
  return scored.map((s, rankIndex) => {
    const labels = deriveAiUiLabels(s.row.aiBreakdown, rankIndex, n);
    return { ...s.row, aiLabels: labels };
  });
}
