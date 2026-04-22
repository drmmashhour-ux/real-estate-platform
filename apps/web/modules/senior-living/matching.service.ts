/**
 * Senior residence matching — weighted rule score (explainable) blended with outcome-based performance.
 * Formula: score = round(baseScore * 0.7 + performanceScore * 0.3).
 */
import { prisma } from "@/lib/db";
import { getPerformanceScoresForResidences, MIN_VIEWS_FOR_PERF } from "./matching-events.service";
import { getOrCreateMatchingWeights } from "./learning.service";
import type { AiInsightRow, MatchResultRow } from "./senior.types";
import { seniorAiCreateFromMatchProfile } from "./senior-match-ai-bridge";

const CARE_ORDER = ["AUTONOMOUS", "SEMI_AUTONOMOUS", "ASSISTED", "FULL_CARE"] as const;

function careRank(level: string): number {
  const i = CARE_ORDER.indexOf(level as (typeof CARE_ORDER)[number]);
  return i >= 0 ? i : 0;
}

function desiredMinCare(profile: {
  mobilityLevel?: string | null;
  medicalNeeds?: string | null;
}): number {
  let rank = 0;
  const m = profile.medicalNeeds?.toUpperCase() ?? "";
  if (m.includes("HEAVY")) rank = Math.max(rank, careRank("FULL_CARE"));
  else if (m.includes("LIGHT")) rank = Math.max(rank, careRank("ASSISTED"));

  const mob = profile.mobilityLevel?.toUpperCase() ?? "";
  if (mob.includes("DEPENDENT")) rank = Math.max(rank, careRank("FULL_CARE"));
  else if (mob.includes("LIMITED")) rank = Math.max(rank, careRank("ASSISTED"));

  return rank;
}

type Partials = { care: number; budget: number; location: number; service: number };

function computePartials(
  profile: {
    mobilityLevel?: string | null;
    medicalNeeds?: string | null;
    budget?: number | null;
    preferredCity?: string | null;
  },
  r: {
    careLevel: string;
    city: string;
    basePrice: number | null;
    priceRangeMin: number | null;
    priceRangeMax: number | null;
    verified: boolean;
    medicalSupport: boolean;
    servicesOffered: { category: string; name: string }[];
  }
): Partials {
  const desiredRank = desiredMinCare(profile);
  const resRank = careRank(r.careLevel);

  const care =
    resRank >= desiredRank ? 88
    : 42;

  let budget = 68;
  const budgetVal = profile.budget;
  if (budgetVal != null) {
    const min = r.priceRangeMin ?? r.basePrice;
    const max = r.priceRangeMax ?? r.basePrice;
    if (min != null && max != null && budgetVal >= min && budgetVal <= max) budget = 94;
    else if (r.basePrice != null && budgetVal >= r.basePrice * 0.85) budget = 74;
    else if (min != null && budgetVal < min) budget = 44;
    else budget = 62;
  }

  const location =
    profile.preferredCity?.trim() && r.city.toLowerCase() === profile.preferredCity.trim().toLowerCase() ? 100
    : 48;

  const serviceHits = r.servicesOffered.filter((s) =>
    profile.medicalNeeds?.toUpperCase().includes("HEAVY") ?
      s.category === "MEDICAL" || s.name.toLowerCase().includes("memory")
    : true
  ).length;

  let service = 46 + Math.min(34, serviceHits * 7);
  if (r.verified) service += 12;
  if (r.medicalSupport && profile.medicalNeeds?.toUpperCase().includes("HEAVY")) service += 10;
  service = Math.min(100, service);

  return { care, budget, location, service };
}

function buildExplanation(args: {
  partials: Partials;
  profile: {
    mobilityLevel?: string | null;
    medicalNeeds?: string | null;
    budget?: number | null;
    preferredCity?: string | null;
  };
  r: {
    careLevel: string;
    city: string;
    verified: boolean;
    servicesOffered: { category: string; name: string }[];
  };
  performanceScore: number;
  funnelViews?: number;
}): string[] {
  const lines: string[] = [];
  const { partials, profile, r, performanceScore } = args;

  if (partials.care >= 75) lines.push("Strong care match");
  else lines.push("Care fit needs a closer look — ask on your visit");

  if (profile.preferredCity?.trim() && r.city.toLowerCase() === profile.preferredCity.trim().toLowerCase()) {
    lines.push("Same city as your choice");
  }

  if (profile.budget != null && partials.budget >= 85) lines.push("Budget lines up with posted pricing");
  else if (profile.budget != null && partials.budget < 55) lines.push("Budget may be tight for posted pricing — ask about options");

  if (r.verified) lines.push("Verified on this platform");

  if (performanceScore >= 72) lines.push("Often chosen by similar families");
  else if (performanceScore >= 58) lines.push("Healthy interest from families browsing here");
  else if ((args.funnelViews ?? 0) >= MIN_VIEWS_FOR_PERF && performanceScore < 48) {
    lines.push("Still building outcome history — rules drive most of this score");
  }

  const dedup = [...new Set(lines)];
  return dedup.slice(0, 5);
}

const BLEND_RULE = 0.7;
const BLEND_PERF = 0.3;

export async function matchResidences(profileId: string): Promise<{
  matches: MatchResultRow[];
  insights: AiInsightRow[];
}> {
  const profile = await prisma.seniorMatchProfile.findUnique({ where: { id: profileId } });
  if (!profile) {
    throw new Error("Match profile not found");
  }

  const residences = await prisma.seniorResidence.findMany({
    include: { servicesOffered: true },
    take: 150,
    orderBy: [{ verified: "desc" }, { name: "asc" }],
  });

  const weights = await getOrCreateMatchingWeights();
  const ids = residences.map((x) => x.id);
  const perfMap = await getPerformanceScoresForResidences(ids);

  const viewRows =
    ids.length === 0 ?
      []
    : await prisma.matchingEvent.groupBy({
        by: ["residenceId"],
        where: { residenceId: { in: ids }, eventType: "VIEW" },
        _count: { _all: true },
      });
  const viewsMap = new Map<string, number>();
  for (const id of ids) viewsMap.set(id, 0);
  for (const row of viewRows) viewsMap.set(row.residenceId, row._count._all);

  const matches: MatchResultRow[] = [];

  for (const r of residences) {
    const partials = computePartials(profile, r);
    const baseScore =
      partials.care * weights.careWeight +
      partials.budget * weights.budgetWeight +
      partials.location * weights.locationWeight +
      partials.service * weights.serviceWeight;

    const performanceScore = perfMap.get(r.id) ?? 50;
    const bias = typeof r.rankBoostPoints === "number" ? Math.max(-5, Math.min(5, r.rankBoostPoints)) : 0;
    const score = Math.round(
      Math.max(0, Math.min(100, baseScore * BLEND_RULE + performanceScore * BLEND_PERF + bias))
    );

    const explanation = buildExplanation({
      partials,
      profile,
      r,
      performanceScore,
      funnelViews: viewsMap.get(r.id),
    });

    matches.push({
      residenceId: r.id,
      score,
      baseScore: Math.round(baseScore * 10) / 10,
      performanceScore,
      explanation,
      reasons: explanation,
    });
  }

  matches.sort((a, b) => b.score - a.score);

  const insights: AiInsightRow[] = [];
  const top = matches[0];
  if (top) {
    insights.push({
      kind: "recommendation",
      message: `Top match scores ${top.score} out of 100 — visit in person before you decide.`,
    });
    const weak = matches.filter((m) => m.score < 45).slice(0, 2);
    for (const w of weak) {
      insights.push({
        kind: "mismatch",
        message: `One option scored lower (${w.score}); location or timing may still make it worthwhile.`,
      });
    }
    const alt = matches.find((m) => m.residenceId !== top.residenceId && m.score >= 55);
    if (alt) {
      insights.push({
        kind: "alternative",
        message: "Another strong option is listed — compare visits side by side.",
      });
    }
  }

  return {
    matches: matches.slice(0, 25),
    insights,
  };
}

export async function createMatchProfile(input: {
  name: string;
  age?: number | null;
  mobilityLevel?: string | null;
  medicalNeeds?: string | null;
  budget?: number | null;
  preferredCity?: string | null;
  userId?: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    const mp = await tx.seniorMatchProfile.create({
      data: {
        name: input.name.trim().slice(0, 256),
        age: input.age ?? undefined,
        mobilityLevel: input.mobilityLevel?.slice(0, 40) ?? null,
        medicalNeeds: input.medicalNeeds?.slice(0, 40) ?? null,
        budget: input.budget ?? undefined,
        preferredCity: input.preferredCity?.slice(0, 160) ?? null,
        userId: input.userId ?? null,
      },
    });
    await tx.seniorAiProfile.create({
      data: seniorAiCreateFromMatchProfile(mp),
    });
    return mp;
  });
}
