import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { fsboCityWhereFromParam } from "@/lib/geo/city-search";
import type { DreamHomeProfile, DreamHomeMatchResult, DreamHomeMatchedListing } from "../types/dream-home.types";
import { scoreListingMatch, buildDefaultRankingPreferences } from "../utils/dream-home-scoring";
import { logDreamHomeMemory } from "./dream-home-playbook-memory.service";

const TAKE = 36;
const RETURN_TOP = 12;

/**
 * Ranks public FSBO listings using profile filters + deterministic scoring (no LLM). Never throws.
 */
export async function matchDreamHomeListings(
  profile: DreamHomeProfile,
  source: "ai" | "deterministic",
): Promise<DreamHomeMatchResult> {
  const warnings: string[] = [];
  const prof: DreamHomeProfile = {
    ...profile,
    rankingPreferences: profile.rankingPreferences ?? buildDefaultRankingPreferences({}),
  };
  const f = prof.searchFilters;
  const minBeds = f.minBedrooms ?? f.bedroomsMin;
  const minBaths = f.minBathrooms ?? f.bathroomsMin;
  const and: Prisma.FsboListingWhereInput[] = [{ status: "ACTIVE" }, { moderationStatus: "APPROVED" }];

  try {
    if (f.city?.trim()) {
      and.push(fsboCityWhereFromParam(f.city.trim()));
    }
    const maxCents = (() => {
      if (f.budgetMax != null && Number.isFinite(f.budgetMax) && f.budgetMax > 0) {
        return Math.floor(f.budgetMax * 100);
      }
      if (f.maxBudget != null && Number.isFinite(f.maxBudget) && f.maxBudget > 0) {
        return Math.floor(f.maxBudget * 100);
      }
      return null;
    })();
    if (maxCents != null) {
      and.push({ priceCents: { lte: maxCents } });
    }
    if (f.budgetMin != null && Number.isFinite(f.budgetMin) && f.budgetMin > 0) {
      and.push({ priceCents: { gte: Math.floor(f.budgetMin * 100) } });
    }
    if (minBeds != null && minBeds > 0) {
      and.push({ bedrooms: { gte: minBeds } });
    }
    if (minBaths != null && minBaths > 0) {
      and.push({ bathrooms: { gte: minBaths } });
    }
    if (f.propertyType?.length) {
      and.push({
        OR: f.propertyType.map((p) => ({
          propertyType: { contains: p, mode: "insensitive" as const },
        })),
      });
    }

    const where: Prisma.FsboListingWhereInput = { AND: and };

    const rows = await prisma.fsboListing.findMany({
      where,
      take: TAKE,
      orderBy: [{ featuredUntil: { sort: "desc", nulls: "last" } }, { updatedAt: "desc" }],
      select: {
        id: true,
        title: true,
        city: true,
        priceCents: true,
        bedrooms: true,
        bathrooms: true,
        coverImage: true,
        propertyType: true,
        description: true,
      },
    });

    const scored: DreamHomeMatchedListing[] = rows.map((r) => {
      const desc = r.description ?? "";
      const sm = scoreListingMatch(prof, {
        title: r.title,
        city: r.city,
        priceCents: r.priceCents,
        bedrooms: r.bedrooms,
        bathrooms: r.bathrooms,
        description: desc,
      });
      const baseWhy = sm.scoreBreakdown?.explanation?.slice(0, 2) ?? [];
      return {
        id: r.id,
        title: r.title,
        city: r.city,
        priceCents: r.priceCents,
        bedrooms: r.bedrooms,
        bathrooms: r.bathrooms,
        coverImage: r.coverImage,
        propertyType: r.propertyType,
        description: desc,
        matchScore: sm.matchScore,
        whyThisFits: baseWhy.length
          ? baseWhy
          : [
              minBeds != null && (r.bedrooms ?? 0) >= minBeds
                ? "Bedroom count matches your minimum."
                : "Meets the filters you set; review details in person or online.",
            ],
        scoreBreakdown: sm.scoreBreakdown,
      };
    });

    scored.sort((a, b) => b.matchScore - a.matchScore);
    const listings = scored.slice(0, RETURN_TOP);

    const tradeoffs: string[] = [
      "Matching uses your explicit filters and listing text — not inferred background.",
      maxCents != null
        ? "If few homes appear, try widening budget, radius, or bedroom count."
        : "Add a budget and city to make affordability and place matching sharper.",
    ];
    if (listings.length === 0) {
      tradeoffs.push("No listings matched all filters — try relaxing bedroom minimum or area.");
    }

    void logDreamHomeMemory({
      actionType: "dream_home_generate_filters",
      triggerEvent: "dream_home.match.executed",
      context: {
        domain: "DREAM_HOME",
        entityType: "dream_home_match",
        market: f.city ? { city: f.city } : undefined,
        segment: { source: "dream_home" },
        signals: { resultCount: listings.length },
      },
      actionPayload: { filters: f, resultCount: listings.length },
    }).catch(() => {});

    return { profile: prof, listings, tradeoffs, source, warnings: warnings.length ? warnings : undefined };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "match_unavailable";
    return {
      profile: prof,
      listings: [],
      tradeoffs: ["Could not run listing search safely; your profile is still saved. Try again shortly.", msg],
      source,
      warnings: [msg],
    };
  }
}
