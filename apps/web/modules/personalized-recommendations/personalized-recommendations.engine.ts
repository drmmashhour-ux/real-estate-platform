import { PlatformRole } from "@prisma/client";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { buildFsboPublicVisibilityWhere } from "@/lib/fsbo/listing-expiry";
import { buildFsboPublicListingPath } from "@/lib/seo/public-urls";
import type { LoadedRecommendationContext } from "./recommendation-context.loader";
import { inferBudgetMaxCad, loadRecommendationContext } from "./recommendation-context.loader";
import { buildUserSafeExplanation, profileSummaryForDebug } from "./recommendation-explainability";
import { recordRecommendationAudit } from "./recommendation-audit.service";
import type {
  GetPersonalizedRecommendationsInput,
  PersonalizedRecommendationItem,
  PersonalizedRecommendationResult,
  RecommendationEntityType,
  RecommendationMode,
} from "./recommendation.types";

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function normScore(raw: number): number {
  return clamp(Math.round(raw), 0, 100);
}

function confidenceFrom(args: { personalizationApplied: boolean; factorCount: number; coldStart: boolean }): number {
  if (args.coldStart) return 52;
  if (!args.personalizationApplied) return 58;
  return clamp(55 + args.factorCount * 6, 40, 92);
}

function excludeSet(ids: string[] | undefined): Set<string> {
  return new Set(ids ?? []);
}

export async function loadFsboMetricsMap(ids: string[]): Promise<Map<string, number>> {
  if (ids.length === 0) return new Map();
  const rows = await prisma.fsboListingMetrics.findMany({
    where: { fsboListingId: { in: ids } },
    select: { fsboListingId: true, rankingScore: true, conversionScore: true },
  });
  const m = new Map<string, number>();
  for (const r of rows) {
    const v = (r.rankingScore || r.conversionScore || 0) / 100;
    m.set(r.fsboListingId, clamp(v, 0, 1.5));
  }
  return m;
}

export function scoreFsboBuyerSync(args: {
  listing: {
    id: string;
    city: string;
    propertyType: string | null;
    priceCents: number;
    createdAt: Date;
    title: string;
    lecipmGreenVerificationLevel: string | null;
  };
  ctx: LoadedRecommendationContext;
  personalization: boolean;
  marketRank01: number;
}): { score: number; factors: Record<string, number> } {
  const { listing, ctx, personalization, marketRank01 } = args;
  const factors: Record<string, number> = {};
  let score = 42;

  factors.marketRanking = clamp(marketRank01, 0, 1);
  score += clamp(marketRank01 * 26, 0, 26);

  const ageDays = (Date.now() - listing.createdAt.getTime()) / 86400000;
  factors.recency = clamp(1 - Math.min(ageDays, 120) / 120, 0, 1) * 0.25;
  score += factors.recency * 8;

  if (!personalization || !ctx.personalizationEnabled) {
    return { score: normScore(score), factors };
  }

  const cityW = ctx.cityWeights[listing.city] ?? 0;
  if (cityW > 0) {
    const aff = clamp(cityW / 12, 0, 1);
    factors.cityAffinity = aff;
    score += aff * 22;
  } else if (ctx.homeCity && listing.city.toLowerCase() === ctx.homeCity.toLowerCase()) {
    factors.cityAffinity = 0.55;
    score += 12;
  } else {
    const w13 = ctx.memory.preferenceSummary;
    const wh = w13["wave13Housing"];
    if (wh && typeof wh === "object" && !Array.isArray(wh)) {
      for (const [k, v] of Object.entries(wh as Record<string, unknown>)) {
        if (k.toLowerCase().includes("location_city") && typeof v === "string" && v) {
          if (listing.city.toLowerCase() === v.toLowerCase()) {
            factors.wave13City = 0.45;
            score += 4;
            break;
          }
        }
      }
    }
  }

  const pt = listing.propertyType ?? "";
  const ptW = pt ? (ctx.propertyTypeWeights[pt] ?? 0) : 0;
  if (ptW > 0) {
    const aff = clamp(ptW / 10, 0, 1);
    factors.propertyTypeAffinity = aff;
    score += aff * 14;
  }

  const budgetMax = inferBudgetMaxCad(ctx);
  const priceCad = listing.priceCents / 100;
  if (budgetMax != null && budgetMax > 0 && priceCad > 0) {
    if (priceCad <= budgetMax * 1.05) {
      factors.budgetFit = clamp(1 - Math.max(0, priceCad - budgetMax) / budgetMax, 0, 1);
      score += 18 * factors.budgetFit;
    } else if (priceCad <= budgetMax * 1.15) {
      factors.budgetFit = 0.35;
      score += 5;
    }
  }

  if (
    ctx.greenViewCount >= 2 &&
    listing.lecipmGreenVerificationLevel &&
    !["NONE", "UNSET", ""].includes(listing.lecipmGreenVerificationLevel)
  ) {
    factors.esgAffinity = 0.7;
    score += 10;
  }

  if (ctx.valueAddHint && listing.title.toLowerCase().includes("renov")) {
    factors.valueAddKeyword = 0.4;
    score += 4;
  }

  if (ctx.savedFsboIds.length && !ctx.savedFsboIds.includes(listing.id)) {
    factors.similarity = 0.22;
    score += 8;
  }

  return { score: normScore(score), factors };
}

async function recommendBuyerFsbo(
  input: GetPersonalizedRecommendationsInput,
  ctx: LoadedRecommendationContext,
): Promise<PersonalizedRecommendationItem[]> {
  const limit = Math.min(input.limit ?? 12, 48);
  const ex = excludeSet(input.excludeEntityIds);
  const cityFilter = input.cityHint?.trim() || Object.entries(ctx.cityWeights).sort((a, b) => b[1] - a[1])[0]?.[0];

  const where = {
    ...buildFsboPublicVisibilityWhere(),
    ...(cityFilter ? { city: { contains: cityFilter, mode: "insensitive" as const } } : {}),
    ...(input.marketSegment ? { propertyType: { contains: input.marketSegment, mode: "insensitive" as const } } : {}),
  };

  const listings = await prisma.fsboListing.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 80,
    select: {
      id: true,
      title: true,
      city: true,
      propertyType: true,
      priceCents: true,
      createdAt: true,
      coverImage: true,
      lecipmGreenVerificationLevel: true,
    },
  });

  const metrics = await loadFsboMetricsMap(listings.map((l) => l.id));
  const personalization = input.personalization !== false;

  const coldStart =
    !ctx.userId ||
    !ctx.personalizationEnabled ||
    !personalization ||
    (ctx.viewedFsboIds.length === 0 && ctx.savedFsboIds.length === 0 && Object.keys(ctx.cityWeights).length === 0);

  const scored: PersonalizedRecommendationItem[] = [];
  for (const l of listings) {
    if (ex.has(l.id)) continue;
    const mr = metrics.get(l.id) ?? 0.35;
    const { score, factors } = scoreFsboBuyerSync({
      listing: l,
      ctx,
      personalization,
      marketRank01: mr,
    });
    scored.push({
      entityType: "FSBO_LISTING",
      entityId: l.id,
      score,
      confidence: 0,
      explanationUserSafe: buildUserSafeExplanation({ factors, mode: "BUYER", coldStart }),
      factorsInternal: factors,
      title: l.title,
      subtitle: `${l.city} · ${(l.priceCents / 100).toLocaleString("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 })}`,
      href: buildFsboPublicListingPath({ id: l.id, city: l.city, propertyType: l.propertyType }),
      imageUrl: l.coverImage,
    });
  }

  scored.sort((a, b) => b.score - a.score);
  for (const s of scored) {
    const fc = Object.keys(s.factorsInternal).filter((k) => (s.factorsInternal[k] ?? 0) > 0).length;
    s.confidence = confidenceFrom({
      personalizationApplied: personalization && ctx.personalizationEnabled && !coldStart,
      factorCount: fc,
      coldStart,
    });
  }
  return scored.slice(0, limit);
}

async function recommendRenterStr(
  input: GetPersonalizedRecommendationsInput,
  ctx: LoadedRecommendationContext,
): Promise<PersonalizedRecommendationItem[]> {
  const limit = Math.min(input.limit ?? 12, 48);
  const ex = excludeSet(input.excludeEntityIds);
  const city =
    input.cityHint?.trim() ||
    Object.entries(ctx.cityWeights).sort((a, b) => b[1] - a[1])[0]?.[0] ||
    ctx.homeCity;

  const stays = await prisma.shortTermListing.findMany({
    where: {
      listingStatus: "PUBLISHED",
      ...(city ? { city: { contains: city, mode: "insensitive" } } : {}),
    },
    take: 60,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      city: true,
      propertyType: true,
      nightPriceCents: true,
      beds: true,
      maxGuests: true,
      aiDiscoveryScore: true,
      bnhubListingCompletedStays: true,
      familyFriendly: true,
      listingPhotos: { take: 1, select: { url: true } },
    },
  });

  const personalization = input.personalization !== false;
  const coldStart = !ctx.userId || !personalization || !ctx.personalizationEnabled;

  const out: PersonalizedRecommendationItem[] = [];
  for (const s of stays) {
    if (ex.has(s.id)) continue;
    const factors: Record<string, number> = {};
    let score = 40;
    const disc = (s.aiDiscoveryScore ?? 45) / 100;
    factors.bookingFit = disc;
    score += disc * 28;
    const pop = clamp(Math.log1p(s.bnhubListingCompletedStays) / 5, 0, 1);
    factors.popularity = pop * 0.6;
    score += pop * 12;

    if (personalization && ctx.personalizationEnabled) {
      const cityW = ctx.cityWeights[s.city] ?? 0;
      if (cityW > 0) {
        factors.guestAffinity = clamp(cityW / 15, 0, 1);
        score += factors.guestAffinity * 18;
      }
      if (ctx.memory.preferenceSummary["family"] === true || ctx.memory.intentSummary["family"] === true) {
        if (s.familyFriendly) {
          factors.familyFit = 0.8;
          score += 12;
        }
      }
    }

    out.push({
      entityType: "SHORT_TERM_LISTING",
      entityId: s.id,
      score: normScore(score),
      confidence: confidenceFrom({
        personalizationApplied: personalization && ctx.personalizationEnabled && !coldStart,
        factorCount: Object.keys(factors).length,
        coldStart,
      }),
      explanationUserSafe: buildUserSafeExplanation({ factors, mode: "RENTER", coldStart }),
      factorsInternal: factors,
      title: s.title,
      subtitle: `${s.city} · from ${(s.nightPriceCents / 100).toLocaleString("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 })}/night`,
      href: `/bnhub/stays/${s.id}`,
      imageUrl: s.listingPhotos[0]?.url ?? null,
    });
  }
  out.sort((a, b) => b.score - a.score);
  return out.slice(0, limit);
}

async function recommendBroker(
  input: GetPersonalizedRecommendationsInput,
  ctx: LoadedRecommendationContext,
  userId: string,
): Promise<PersonalizedRecommendationItem[]> {
  const limit = Math.min(input.limit ?? 12, 48);
  if (ctx.role !== PlatformRole.BROKER && ctx.role !== PlatformRole.ADMIN) return [];

  const leads = await prisma.lead.findMany({
    where: { introducedByBrokerId: userId },
    take: 20,
    orderBy: { score: "desc" },
    select: { id: true, name: true, score: true, conversionProbability: true, aiTier: true, purchaseRegion: true },
  });

  const deals = await prisma.deal.findMany({
    where: { brokerId: userId, NOT: { status: { in: ["closed", "cancelled"] } } },
    take: 20,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      dealCode: true,
      crmStage: true,
      dealScores: { take: 1, orderBy: { createdAt: "desc" }, select: { score: true } },
      closeProbabilities: { take: 1, orderBy: { createdAt: "desc" }, select: { probability: true } },
    },
  });

  const accesses = await prisma.brokerListingAccess.findMany({
    where: { brokerId: userId },
    take: 15,
    select: { listingId: true },
  });
  const listingIds = accesses.map((a) => a.listingId);
  const crmListings =
    listingIds.length > 0 ?
      await prisma.listing.findMany({
        where: { id: { in: listingIds } },
        take: 15,
        select: { id: true, title: true, price: true, listingType: true },
      })
    : [];

  const items: PersonalizedRecommendationItem[] = [];

  for (const l of leads) {
    const factors: Record<string, number> = {
      leadScore: clamp(l.score / 100, 0, 1),
      tierBoost: l.aiTier === "hot" ? 0.35 : l.aiTier === "warm" ? 0.18 : 0,
      conv: clamp(l.conversionProbability ?? 0.4, 0, 1),
    };
    let score = 40 + factors.leadScore * 22 + factors.tierBoost * 20 + factors.conv * 18;
    items.push({
      entityType: "LEAD",
      entityId: l.id,
      score: normScore(score),
      confidence: 68,
      explanationUserSafe: buildUserSafeExplanation({ factors, mode: "BROKER", coldStart: false }),
      factorsInternal: factors,
      title: l.name,
      subtitle: l.purchaseRegion ? `Lead · ${l.purchaseRegion}` : "CRM lead",
      href: "/dashboard/broker",
    });
  }

  for (const d of deals) {
    const ds = d.dealScores[0]?.score ?? 55;
    const cp = d.closeProbabilities[0]?.probability ?? 0.45;
    const factors: Record<string, number> = {
      dealMomentum: clamp(ds / 100, 0, 1),
      closeProb: clamp(cp, 0, 1),
    };
    let score = 42 + factors.dealMomentum * 26 + factors.closeProb * 24;
    items.push({
      entityType: "DEAL",
      entityId: d.id,
      score: normScore(score),
      confidence: 72,
      explanationUserSafe: buildUserSafeExplanation({ factors, mode: "BROKER", coldStart: false }),
      factorsInternal: factors,
      title: d.dealCode ?? "Deal",
      subtitle: d.crmStage ?? "Active",
      href: "/dashboard/broker",
    });
  }

  for (const cl of crmListings) {
    const factors: Record<string, number> = { inventory: 0.5 };
    const score = 55;
    items.push({
      entityType: "CRM_LISTING",
      entityId: cl.id,
      score,
      confidence: 60,
      explanationUserSafe: buildUserSafeExplanation({ factors, mode: "BROKER", coldStart: false }),
      factorsInternal: factors,
      title: cl.title,
      subtitle: `${String(cl.listingType)} · ${cl.price.toLocaleString("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 })}`,
      href: `/listings/${cl.id}`,
    });
  }

  items.sort((a, b) => b.score - a.score);
  return items.slice(0, limit);
}

async function recommendInvestor(input: GetPersonalizedRecommendationsInput, ctx: LoadedRecommendationContext, userId: string) {
  const limit = Math.min(input.limit ?? 12, 48);
  const deals = await prisma.investmentPipelineDeal.findMany({
    where: { ownerUserId: userId, closedAt: null },
    take: 30,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      pipelineStage: true,
      underwritingScore: true,
      underwritingLabel: true,
      underwritingRecommendation: true,
      decisionStatus: true,
    },
  });

  const riskHint = ctx.memory.riskProfile["tolerance"] as string | undefined;
  const items: PersonalizedRecommendationItem[] = [];

  for (const d of deals) {
    const factors: Record<string, number> = {};
    let score = 45;
    const uw = d.underwritingScore ?? 55;
    factors.underwritingFit = clamp(uw / 100, 0, 1);
    score += factors.underwritingFit * 30;
    if (d.underwritingLabel === "STRONG") {
      factors.labelBoost = 0.25;
      score += 10;
    }
    if (riskHint === "value_add" || ctx.valueAddHint) {
      if (d.underwritingRecommendation === "BUY_WITH_RETROFIT_PLAN") {
        factors.investorFit = 0.6;
        score += 14;
      }
    } else {
      factors.investorFit = 0.35;
      score += 6;
    }
    items.push({
      entityType: "INVESTMENT_PIPELINE_DEAL",
      entityId: d.id,
      score: normScore(score),
      confidence: d.underwritingScore != null ? 74 : 55,
      explanationUserSafe: buildUserSafeExplanation({ factors, mode: "INVESTOR", coldStart: false }),
      factorsInternal: factors,
      title: d.title,
      subtitle: `${d.pipelineStage}${d.decisionStatus ? ` · ${d.decisionStatus}` : ""}`,
      href: "/dashboard/investor",
    });
  }

  if (ctx.role === PlatformRole.BROKER || ctx.role === PlatformRole.ADMIN) {
    const opps = await prisma.lecipmOpportunityCandidate.findMany({
      where: { brokerUserId: userId, status: { in: ["NEW", "REVIEWED"] } },
      take: 10,
      orderBy: { score: "desc" },
      select: { id: true, score: true, opportunityType: true, rationaleJson: true },
    });
    for (const o of opps) {
      const factors: Record<string, number> = { opportunity: clamp(o.score / 100, 0, 1) };
      items.push({
        entityType: "OPPORTUNITY",
        entityId: o.id,
        score: o.score,
        confidence: 70,
        explanationUserSafe: buildUserSafeExplanation({ factors, mode: "INVESTOR", coldStart: false }),
        factorsInternal: factors,
        title: `Opportunity · ${o.opportunityType}`,
        subtitle: "Discovery desk",
        href: "/dashboard/opportunities",
      });
    }
  }

  items.sort((a, b) => b.score - a.score);
  return items.slice(0, limit);
}

export async function getSimilarFsboForListingPage(args: {
  userId: string | null;
  seedFsboListingId: string;
  limit?: number;
  personalization?: boolean;
}): Promise<PersonalizedRecommendationResult> {
  const seed = await prisma.fsboListing.findUnique({
    where: { id: args.seedFsboListingId },
    select: { id: true, city: true, propertyType: true },
  });
  if (!seed) {
    return {
      mode: "BUYER",
      personalizationEnabled: true,
      personalizationApplied: false,
      coldStart: true,
      marketSegment: null,
      items: [],
      privacyNote:
        "Suggestions are informational. Personalization respects your Marketplace memory settings.",
    };
  }
  return getPersonalizedRecommendations({
    userId: args.userId,
    mode: "BUYER",
    limit: args.limit ?? 6,
    personalization: args.personalization !== false,
    cityHint: seed.city,
    marketSegment: seed.propertyType ?? undefined,
    excludeEntityIds: [seed.id],
  });
}

export async function getPersonalizedRecommendations(
  input: GetPersonalizedRecommendationsInput,
): Promise<PersonalizedRecommendationResult> {
  const ctx = await loadRecommendationContext(input.userId);
  const mode: RecommendationMode = input.mode;
  const personalizationRequested = input.personalization !== false;
  const personalizationApplied = Boolean(
    ctx.userId && ctx.personalizationEnabled && personalizationRequested,
  );

  let items: PersonalizedRecommendationItem[] = [];
  if (mode === "BUYER") {
    items = await recommendBuyerFsbo(input, ctx);
  } else if (mode === "RENTER") {
    items = await recommendRenterStr(input, ctx);
  } else if (mode === "BROKER" && input.userId) {
    items = await recommendBroker(input, ctx, input.userId);
  } else if (mode === "INVESTOR" && input.userId) {
    items = await recommendInvestor(input, ctx, input.userId);
  }

  const coldStart =
    !ctx.userId ||
    !personalizationApplied ||
    (mode === "BUYER" &&
      ctx.viewedFsboIds.length === 0 &&
      ctx.savedFsboIds.length === 0 &&
      Object.keys(ctx.cityWeights).length === 0);

  if (input.userId && personalizationApplied) {
    await recordRecommendationAudit({
      userId: input.userId,
      kind: "audit:generated",
      mode,
      metadata: { count: items.length, coldStart },
    }).catch(() => null);
  }

  const privacyNote =
    "Suggestions are informational. We use optional activity and preferences only when personalization is on — never hidden investor qualification. You can turn personalization off in Marketplace memory.";

  const debug =
    input.debug ?
      {
        topFactors: items[0] ?
          Object.entries(items[0].factorsInternal)
            .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
            .slice(0, 8)
            .map(([key, weight]) => ({ key, weight }))
        : [],
        profileSummary: profileSummaryForDebug(ctx),
      }
    : undefined;

  return {
    mode,
    personalizationEnabled: ctx.personalizationEnabled,
    personalizationApplied,
    coldStart,
    marketSegment: input.marketSegment ?? null,
    items,
    privacyNote,
    debug,
  };
}
