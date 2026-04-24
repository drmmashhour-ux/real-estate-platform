import { prisma } from "@repo/db";
import type { PlatformRole } from "@prisma/client";

export type LoadedRecommendationContext = {
  userId: string | null;
  role: PlatformRole | null;
  homeCity: string | null;
  personalizationEnabled: boolean;
  /** From `UserMemoryProfile` JSON blobs — opaque, parsed lightly. */
  memory: {
    intentSummary: Record<string, unknown>;
    preferenceSummary: Record<string, unknown>;
    behaviorSummary: Record<string, unknown>;
    financialProfile: Record<string, unknown>;
    esgProfile: Record<string, unknown>;
    riskProfile: Record<string, unknown>;
  };
  /** Cities weighted by recent views (FSBO). */
  cityWeights: Record<string, number>;
  /** Property types weighted by views + saves. */
  propertyTypeWeights: Record<string, number>;
  /** Median of viewed listing prices (CAD, from priceCents). */
  medianViewedPriceCad: number | null;
  /** Count of viewed listings with green verification flag (proxy for ESG interest). */
  greenViewCount: number;
  viewedFsboIds: string[];
  savedFsboIds: string[];
  valueAddHint: boolean;
};

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

function readNumber(obj: Record<string, unknown>, key: string): number | null {
  const v = obj[key];
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export async function loadRecommendationContext(userId: string | null): Promise<LoadedRecommendationContext> {
  const empty: LoadedRecommendationContext = {
    userId,
    role: null,
    homeCity: null,
    personalizationEnabled: false,
    memory: {
      intentSummary: {},
      preferenceSummary: {},
      behaviorSummary: {},
      financialProfile: {},
      esgProfile: {},
      riskProfile: {},
    },
    cityWeights: {},
    propertyTypeWeights: {},
    medianViewedPriceCad: null,
    greenViewCount: 0,
    viewedFsboIds: [],
    savedFsboIds: [],
    valueAddHint: false,
  };

  if (!userId) return empty;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      homeCity: true,
      launchPersonaChoice: true,
      marketplacePersona: true,
    },
  });

  const profile = await prisma.userMemoryProfile.findUnique({
    where: { userId },
  });

  const personalizationEnabled = profile?.personalizationEnabled ?? true;

  const memory = {
    intentSummary: asRecord(profile?.intentSummaryJson),
    preferenceSummary: asRecord(profile?.preferenceSummaryJson),
    behaviorSummary: asRecord(profile?.behaviorSummaryJson),
    financialProfile: asRecord(profile?.financialProfileJson),
    esgProfile: asRecord(profile?.esgProfileJson),
    riskProfile: asRecord(profile?.riskProfileJson),
  };

  const views = await prisma.buyerListingView.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 40,
    select: {
      fsboListingId: true,
      fsboListing: {
        select: {
          city: true,
          propertyType: true,
          priceCents: true,
          id: true,
          lecipmGreenVerificationLevel: true,
        },
      },
    },
  });

  const saves = await prisma.buyerSavedListing.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 40,
    select: {
      fsboListingId: true,
      fsboListing: {
        select: { city: true, propertyType: true, priceCents: true, id: true },
      },
    },
  });

  const cityWeights: Record<string, number> = {};
  const propertyTypeWeights: Record<string, number> = {};
  const prices: number[] = [];
  let greenViewCount = 0;
  const viewedFsboIds: string[] = [];
  const savedFsboIds: string[] = [];

  const bump = (m: Record<string, number>, k: string, w: number) => {
    if (!k) return;
    m[k] = (m[k] ?? 0) + w;
  };

  for (const v of views) {
    viewedFsboIds.push(v.fsboListingId);
    const l = v.fsboListing;
    bump(cityWeights, l.city, 2);
    if (l.propertyType) bump(propertyTypeWeights, l.propertyType, 2);
    prices.push(l.priceCents / 100);
    if (l.lecipmGreenVerificationLevel && !["NONE", "UNSET", ""].includes(l.lecipmGreenVerificationLevel)) {
      greenViewCount += 1;
    }
  }
  for (const s of saves) {
    savedFsboIds.push(s.fsboListingId);
    const l = s.fsboListing;
    bump(cityWeights, l.city, 3);
    if (l.propertyType) bump(propertyTypeWeights, l.propertyType, 3);
    prices.push(l.priceCents / 100);
  }

  prices.sort((a, b) => a - b);
  const mid = Math.floor(prices.length / 2);
  const medianViewedPriceCad = prices.length ? (prices.length % 2 ? prices[mid]! : (prices[mid - 1]! + prices[mid]!) / 2) : null;

  const valueAddHint =
    String(memory.preferenceSummary["valueAdd"] ?? "").toLowerCase() === "true" ||
    String(memory.intentSummary["retrofit"] ?? "").toLowerCase() === "true" ||
    String(user?.launchPersonaChoice ?? "").toLowerCase() === "invest";

  return {
    userId,
    role: user?.role ?? null,
    homeCity: user?.homeCity ?? null,
    personalizationEnabled,
    memory,
    cityWeights,
    propertyTypeWeights,
    medianViewedPriceCad,
    greenViewCount,
    viewedFsboIds,
    savedFsboIds,
    valueAddHint,
  };
}

/** Budget max from memory or inferred from behavior (CAD). */
export function inferBudgetMaxCad(ctx: LoadedRecommendationContext): number | null {
  const fp = ctx.memory.financialProfile;
  const explicit =
    readNumber(fp, "budgetMaxCad") ??
    readNumber(fp, "budgetMax") ??
    readNumber(fp, "maxBudgetCad");
  if (explicit != null && explicit > 0) return explicit;
  if (ctx.medianViewedPriceCad != null && ctx.medianViewedPriceCad > 0) {
    return Math.round(ctx.medianViewedPriceCad * 1.25);
  }
  return null;
}
