import { logDreamHomeRankListings, logDreamHomeRecommendPlaybook } from "./dream-home-playbook-memory.service";
import { getDreamHomePlaybookRecommendations } from "./dream-home-playbook.service";
import type { DreamHomeMatchedListing, DreamHomeProfile } from "../types/dream-home.types";
import { buildDefaultRankingPreferences, scoreListingMatch } from "../utils/dream-home-scoring";
import {
  buildPersonalizationContext,
  personalisationListingNudge,
} from "@/modules/user-intelligence/services/user-personalization.service";
import type { UserPersonalizationContext } from "@/modules/user-intelligence/types/user-intelligence.types";

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
  options?: {
    playbookBoostPlaybookId?: string | null;
    /** Logged-in user: merges Wave 13 profile + applies small listing nudge (session filters still dominate). */
    userId?: string | null;
    /** Current-session search filters / questionnaire — overrides stored housing prefs in personalization merge. */
    sessionPreferenceOverride?: Record<string, unknown> | null;
  },
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
  const sessionOverride =
    options?.sessionPreferenceOverride ??
    (prof.searchFilters && typeof prof.searchFilters === "object" && !Array.isArray(prof.searchFilters)
      ? (prof.searchFilters as Record<string, unknown>)
      : null);
  let persCtx: UserPersonalizationContext | null = null;
  if (options?.userId?.trim()) {
    try {
      const res = await buildPersonalizationContext(options.userId.trim(), sessionOverride);
      if (res.ok && res.data.hasProfile) {
        persCtx = res.data;
      }
    } catch {
      /* */
    }
  }
  let playbookBoost = 0;
  let playbooksConsidered = false;
  try {
    const recs = await getDreamHomePlaybookRecommendations({
      segment: prof.searchFilters as Record<string, unknown>,
      userId: options?.userId?.trim() || null,
    });
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
    let matchScore = r.matchScore;
    const rankNotes: string[] = [];
    if (persCtx) {
      const n = personalisationListingNudge(matchScore, persCtx, c.city);
      matchScore = n.score;
      if (n.reason !== "neutral" && n.reason !== "no_stored_profile") {
        rankNotes.push(`Personalization: ${n.reason}`);
      }
    }
    return {
      ...c,
      matchScore,
      scoreBreakdown: r.scoreBreakdown,
      _persNotes: rankNotes,
    };
  });
  withScores.sort((a, b) => b.matchScore - a.matchScore);
  const ranked: RankedListing[] = withScores.map((L, i) => {
    const extra = (L as { _persNotes?: string[] })._persNotes ?? [];
    const { _persNotes: _n, ...rest } = L as typeof L & { _persNotes?: string[] };
    return {
      ...rest,
      rank: i + 1,
      rankRationale: [
        `Position ${i + 1} by combined filter + lifestyle text fit (${L.matchScore.toFixed(2)}).`,
        ...extra,
        ...(L.scoreBreakdown?.explanation ?? []).slice(0, 2),
      ],
    };
  });
  void logDreamHomeRankListings({ listingIds: ranked.map((x) => x.id), topN: ranked.length }).catch(() => {});
  return { ranked, playbooksConsidered, warnings };
}

/** @alias rankDreamHomeListings */
export const rankListings = rankDreamHomeListings;
