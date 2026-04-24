import { logDreamHomeRankListings, logDreamHomeRecommendPlaybook } from "./dream-home-playbook-memory.service";
import { getDreamHomePlaybookRecommendations } from "./dream-home-playbook.service";
import type { DreamHomeMatchedListing, DreamHomeProfile } from "../types/dream-home.types";
import { buildDefaultRankingPreferences, scoreListingMatch } from "../utils/dream-home-scoring";

export type RankedListing = DreamHomeMatchedListing & {
  rank: number;
  rankRationale: string[];
};

/**
 * Ranks pre-fetched candidates; explainable, deterministic. Never throws.
 */
export async function rankDreamHomeListings(
  profile: DreamHomeProfile,
  candidates: DreamHomeMatchedListing[],
  options?: { playbookBoostPlaybookId?: string | null },
): Promise<{
  ranked: RankedListing[];
  playbooksConsidered: boolean;
  warnings: string[];
}> {
  const warnings: string[] = [];
  if (!candidates.length) {
    return { ranked: [], playbooksConsidered: false, warnings: ["No candidate listings to rank."] };
  }
  const prof: DreamHomeProfile = {
    ...profile,
    rankingPreferences: profile.rankingPreferences ?? buildDefaultRankingPreferences({}),
  };
  let playbookBoost = 0;
  let playbooksConsidered = false;
  try {
    const recs = await getDreamHomePlaybookRecommendations({ segment: prof.searchFilters as Record<string, unknown> });
    playbooksConsidered = true;
    const top = recs[0];
    if (top) {
      if (!options?.playbookBoostPlaybookId || top.playbookId === options.playbookBoostPlaybookId) {
        playbookBoost = Math.min(0.12, top.score * 0.08);
        void logDreamHomeRecommendPlaybook({ playbookId: top.playbookId, reason: "context_fit_for_rank_blend" }).catch(
          () => {},
        );
      }
    }
  } catch {
    playbooksConsidered = true;
  }

  const withScores = candidates.map((c) => {
    const r = scoreListingMatch(
      prof,
      {
        title: c.title,
        city: c.city,
        priceCents: c.priceCents,
        bedrooms: c.bedrooms,
        bathrooms: c.bathrooms,
        description: c.description?.length ? c.description : c.whyThisFits.join(" "),
      },
      { playbookBoost },
    );
    return {
      ...c,
      matchScore: r.matchScore,
      scoreBreakdown: r.scoreBreakdown,
    };
  });
  withScores.sort((a, b) => b.matchScore - a.matchScore);
  const ranked: RankedListing[] = withScores.map((L, i) => ({
    ...L,
    rank: i + 1,
    rankRationale: [
      `Position ${i + 1} by combined filter + lifestyle text fit (${L.matchScore.toFixed(2)}).`,
      ...(L.scoreBreakdown?.explanation ?? []).slice(0, 2),
    ],
  }));
  void logDreamHomeRankListings({ listingIds: ranked.map((x) => x.id), topN: ranked.length }).catch(() => {});
  return { ranked, playbooksConsidered, warnings };
}

/** @alias rankDreamHomeListings */
export const rankListings = rankDreamHomeListings;
