/**
 * LECIPM dynamic market pricing — LEAD | SUBSCRIPTION | FEATURED.
 * Uses demand + quality signals with gradual factor updates (no sudden spikes).
 * Tables: `LecipmMarketPricingRule`, `LecipmPricingEvent` (distinct from listing `PricingRule`).
 */
import { prisma } from "@/lib/db";
import { getLatestLeadScore, type LeadBand } from "@/modules/senior-living/lead-scoring.service";
import {
  getLeadPricingRolloutRelativeDelta,
  getPricingRolloutRelativeDelta,
} from "@/modules/rollout/rollout-runtime.service";
import { ROLLOUT_STRATEGY } from "@/modules/rollout/rollout.constants";

export const MARKET_PRICING_TYPES = {
  LEAD: "LEAD",
  SUBSCRIPTION: "SUBSCRIPTION",
  FEATURED: "FEATURED",
} as const;

export type MarketPricingType = (typeof MARKET_PRICING_TYPES)[keyof typeof MARKET_PRICING_TYPES];

const DEFAULTS: Record<
  MarketPricingType,
  { basePrice: number; minPrice: number; maxPrice: number }
> = {
  LEAD: { basePrice: 49, minPrice: 29, maxPrice: 149 },
  SUBSCRIPTION: { basePrice: 129, minPrice: 79, maxPrice: 499 },
  FEATURED: { basePrice: 79, minPrice: 49, maxPrice: 299 },
};

/** Exponential smoothing for stored factors — limits runaway adjustments. */
const SMOOTHING = 0.78;
const INNOVATION = 0.22;
/** Max absolute change per factor update (guardrail). */
const MAX_FACTOR_STEP = 0.045;
/** Min hours between persisting new demand/quality factors (avoids price drift on every page view). */
const FACTOR_REFRESH_MIN_MS = 4 * 60 * 60 * 1000;
/** Demand signal maps to multiplier in [DEMAND_FLOOR, DEMAND_CAP]. */
const DEMAND_FLOOR = 0.9;
const DEMAND_CAP = 1.22;
/** Quality signal maps to [QUALITY_FLOOR, QUALITY_CAP]. */
const QUALITY_FLOOR = 0.88;
const QUALITY_CAP = 1.18;

const LEAD_BAND_MULT: Record<LeadBand, number> = {
  HIGH: 1.14,
  MEDIUM: 1,
  LOW: 0.9,
};

export async function getOrCreateMarketRule(type: MarketPricingType) {
  const def = DEFAULTS[type];
  const existing = await prisma.lecipmMarketPricingRule.findUnique({ where: { type } });
  if (existing) return existing;
  return prisma.lecipmMarketPricingRule.create({
    data: {
      type,
      basePrice: def.basePrice,
      minPrice: def.minPrice,
      maxPrice: def.maxPrice,
      demandFactor: 1,
      qualityFactor: 1,
    },
  });
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function limitStep(prev: number, next: number, maxStep: number): number {
  const delta = next - prev;
  if (Math.abs(delta) <= maxStep) return next;
  return prev + Math.sign(delta) * maxStep;
}

/** Exported for tests — normalized 0–1 demand pressure. */
export function normalizeDemandIndexMetrics(args: {
  leadsLast30d: number;
  operatorCount: number;
  residencesInMarket: number;
  activeUsersProxy: number;
}): number {
  const lv = Math.min(1, args.leadsLast30d / 45);
  const op = Math.min(1, args.operatorCount / 80);
  const res = Math.min(1, args.residencesInMarket / 120);
  const u = Math.min(1, args.activeUsersProxy / 5000);
  return 0.35 * lv + 0.3 * op + 0.2 * res + 0.15 * u;
}

/** Senior lead closed / total in window (conversion proxy). */
async function seniorConversionRateSince(since: Date): Promise<number> {
  const [total, closed] = await Promise.all([
    prisma.seniorLead.count({ where: { createdAt: { gte: since } } }),
    prisma.seniorLead.count({
      where: { createdAt: { gte: since }, status: "CLOSED" },
    }),
  ]);
  if (total === 0) return 0.12;
  return closed / total;
}

export async function computeDemandQualitySignals(options?: {
  /** Filter operators/residences by city (optional, case-insensitive). */
  city?: string | null;
}) {
  const thirty = new Date();
  thirty.setDate(thirty.getDate() - 30);
  const ninety = new Date();
  ninety.setDate(ninety.getDate() - 90);

  const cityFilter = options?.city?.trim();
  const resWhere =
    cityFilter ?
      { city: { equals: cityFilter, mode: "insensitive" as const } }
    : {};

  const operatorWhere = {
    operatorId: { not: null },
    ...(cityFilter ? { city: { equals: cityFilter, mode: "insensitive" as const } } : {}),
  };

  const [leadsLast30d, residencesInMarket, operatorRows, conv90, activeUsersProxy] = await Promise.all([
    prisma.seniorLead.count({ where: { createdAt: { gte: thirty } } }),
    prisma.seniorResidence.count({ where: resWhere }),
    prisma.seniorResidence.groupBy({
      by: ["operatorId"],
      where: operatorWhere,
    }),
    seniorConversionRateSince(ninety),
    prisma.user.count({
      where: {
        accountStatus: "ACTIVE",
        updatedAt: { gte: thirty },
      },
    }),
  ]);

  const operatorCount = operatorRows.length;

  const demandIndex = normalizeDemandIndexMetrics({
    leadsLast30d,
    operatorCount,
    residencesInMarket,
    activeUsersProxy,
  });

  const demandTarget = DEMAND_FLOOR + demandIndex * (DEMAND_CAP - DEMAND_FLOOR);

  const qualityFromConversion = QUALITY_FLOOR + clamp(conv90 / 0.35, 0, 1) * (QUALITY_CAP - QUALITY_FLOOR);

  return {
    leadsLast30d,
    operatorCount,
    residencesInMarket,
    activeUsersProxy,
    conversionRate: conv90,
    demandTarget,
    qualityTarget: qualityFromConversion,
  };
}

async function smoothAndPersistFactors(
  type: MarketPricingType,
  demandTarget: number,
  qualityTarget: number,
  force = false
): Promise<{ demandFactor: number; qualityFactor: number }> {
  const rule = await getOrCreateMarketRule(type);
  const stale =
    force ||
    rule.factorVersion === 0 ||
    Date.now() - rule.updatedAt.getTime() >= FACTOR_REFRESH_MIN_MS;

  if (!stale) {
    return { demandFactor: rule.demandFactor, qualityFactor: rule.qualityFactor };
  }

  let demand = SMOOTHING * rule.demandFactor + INNOVATION * demandTarget;
  let quality = SMOOTHING * rule.qualityFactor + INNOVATION * qualityTarget;
  demand = limitStep(rule.demandFactor, demand, MAX_FACTOR_STEP);
  quality = limitStep(rule.qualityFactor, quality, MAX_FACTOR_STEP);
  demand = clamp(demand, 0.75, 1.35);
  quality = clamp(quality, 0.75, 1.35);

  await prisma.lecipmMarketPricingRule.update({
    where: { type },
    data: {
      demandFactor: demand,
      qualityFactor: quality,
      factorVersion: { increment: 1 },
    },
  });

  return { demandFactor: demand, qualityFactor: quality };
}

export function computeFinalPrice(args: {
  basePrice: number;
  minPrice: number;
  maxPrice: number;
  demandFactor: number;
  qualityFactor: number;
  /** Extra multiplier (e.g. lead band) — applied inside clamp. */
  overlayMultiplier?: number;
}): number {
  const m = args.overlayMultiplier ?? 1;
  const raw = args.basePrice * args.demandFactor * args.qualityFactor * m;
  return clamp(raw, args.minPrice, args.maxPrice);
}

export type LeadPricingQuote = {
  type: "LEAD";
  currency: "CAD";
  basePrice: number;
  minPrice: number;
  maxPrice: number;
  demandFactor: number;
  qualityFactor: number;
  leadBandMultiplier: number;
  leadBand: LeadBand | null;
  finalPrice: number;
  explanation: string[];
};

export async function getLeadPricingQuote(input?: {
  leadId?: string | null;
  city?: string | null;
  recordEvent?: boolean;
  /** Force recomputing smoothed factors (admin / cron). */
  refreshFactors?: boolean;
  /** Stable id for rollout cohort (defaults to leadId). */
  cohortEntityId?: string | null;
}): Promise<LeadPricingQuote> {
  const sig = await computeDemandQualitySignals({ city: input?.city });
  const { demandFactor, qualityFactor } = await smoothAndPersistFactors(
    MARKET_PRICING_TYPES.LEAD,
    sig.demandTarget,
    sig.qualityTarget,
    input?.refreshFactors === true
  );

  const rule = await getOrCreateMarketRule(MARKET_PRICING_TYPES.LEAD);

  const cohortId = input?.cohortEntityId ?? input?.leadId ?? null;
  const rolloutRel = await getLeadPricingRolloutRelativeDelta(cohortId);
  const effectiveBase =
    rolloutRel != null ?
      Math.min(rule.maxPrice, Math.max(rule.minPrice, rule.basePrice * (1 + rolloutRel)))
    : rule.basePrice;

  let leadBand: LeadBand | null = null;
  let mult = 1;
  if (input?.leadId) {
    const score = await getLatestLeadScore(input.leadId);
    if (score?.band) {
      leadBand = score.band as LeadBand;
      mult = LEAD_BAND_MULT[leadBand] ?? 1;
    }
  }

  const finalPrice = computeFinalPrice({
    basePrice: effectiveBase,
    minPrice: rule.minPrice,
    maxPrice: rule.maxPrice,
    demandFactor,
    qualityFactor,
    overlayMultiplier: mult,
  });

  const explanation: string[] = [
    `Base reference $${rule.basePrice.toFixed(0)} CAD before market adjustments.`,
    `Demand in the last 30 days supports a ${(demandFactor * 100 - 100).toFixed(1)}% vs neutral demand adjustment.`,
    `Quality and conversion signals support a ${(qualityFactor * 100 - 100).toFixed(1)}% vs neutral quality adjustment.`,
  ];
  if (leadBand) {
    explanation.push(
      leadBand === "HIGH" ?
        "This lead is scored as high quality — platform fee reflects stronger expected conversion."
      : leadBand === "LOW" ?
        "This lead shows lighter engagement signals — fee is discounted within guardrails."
      : "Mid-tier lead quality — standard fee band."
    );
  }

  if (input?.recordEvent !== false) {
    void prisma.lecipmPricingEvent
      .create({
        data: {
          type: MARKET_PRICING_TYPES.LEAD,
          price: finalPrice,
          context: {
            leadId: input?.leadId ?? null,
            city: input?.city ?? null,
            demandFactor,
            qualityFactor,
            leadBand,
            bandMultiplier: mult,
            signals: sig,
          },
        },
      })
      .catch(() => {});
  }

  return {
    type: "LEAD",
    currency: "CAD",
    basePrice: effectiveBase,
    minPrice: rule.minPrice,
    maxPrice: rule.maxPrice,
    demandFactor,
    qualityFactor,
    leadBandMultiplier: mult,
    leadBand,
    finalPrice: Math.round(finalPrice * 100) / 100,
    explanation,
  };
}

export type SubscriptionPricingQuote = {
  type: "SUBSCRIPTION";
  currency: "CAD";
  basePrice: number;
  minPrice: number;
  maxPrice: number;
  demandFactor: number;
  qualityFactor: number;
  finalPrice: number;
  explanation: string[];
};

export async function getSubscriptionPricingQuote(options?: {
  recordEvent?: boolean;
  refreshFactors?: boolean;
}): Promise<SubscriptionPricingQuote> {
  const sig = await computeDemandQualitySignals();
  const { demandFactor, qualityFactor } = await smoothAndPersistFactors(
    MARKET_PRICING_TYPES.SUBSCRIPTION,
    sig.demandTarget,
    sig.qualityTarget,
    options?.refreshFactors === true
  );
  const rule = await getOrCreateMarketRule(MARKET_PRICING_TYPES.SUBSCRIPTION);
  const finalPrice = computeFinalPrice({
    basePrice: rule.basePrice,
    minPrice: rule.minPrice,
    maxPrice: rule.maxPrice,
    demandFactor,
    qualityFactor,
  });

  const explanation = [
    `Operator subscription reference $${rule.basePrice.toFixed(0)} CAD / period.`,
    `Active usage and demand adjust the live price by ~${((demandFactor * qualityFactor - 1) * 100).toFixed(1)}% vs baseline (smoothed weekly).`,
    "Price cannot jump more than a few percent per update — see min/max for your market.",
  ];

  if (options?.recordEvent !== false) {
    void prisma.lecipmPricingEvent
      .create({
        data: {
          type: MARKET_PRICING_TYPES.SUBSCRIPTION,
          price: finalPrice,
          context: { demandFactor, qualityFactor, signals: sig },
        },
      })
      .catch(() => {});
  }

  return {
    type: "SUBSCRIPTION",
    currency: "CAD",
    basePrice: rule.basePrice,
    minPrice: rule.minPrice,
    maxPrice: rule.maxPrice,
    demandFactor,
    qualityFactor,
    finalPrice: Math.round(finalPrice * 100) / 100,
    explanation,
  };
}

export type FeaturedPricingQuote = {
  type: "FEATURED";
  currency: "CAD";
  basePrice: number;
  minPrice: number;
  maxPrice: number;
  demandFactor: number;
  qualityFactor: number;
  finalPrice: number;
  explanation: string[];
  city: string | null;
};

export async function getFeaturedPlacementQuote(input?: {
  city?: string | null;
  recordEvent?: boolean;
  refreshFactors?: boolean;
  cohortEntityId?: string | null;
}): Promise<FeaturedPricingQuote> {
  const sig = await computeDemandQualitySignals({ city: input?.city });
  const { demandFactor, qualityFactor } = await smoothAndPersistFactors(
    MARKET_PRICING_TYPES.FEATURED,
    sig.demandTarget,
    sig.qualityTarget,
    input?.refreshFactors === true
  );
  const rule = await getOrCreateMarketRule(MARKET_PRICING_TYPES.FEATURED);
  const rolloutRel = await getPricingRolloutRelativeDelta(
    input?.cohortEntityId ?? null,
    ROLLOUT_STRATEGY.FEATURED_BASE_PRICE_RELATIVE,
  );
  const effectiveBase =
    rolloutRel != null ?
      Math.min(rule.maxPrice, Math.max(rule.minPrice, rule.basePrice * (1 + rolloutRel)))
    : rule.basePrice;

  const finalPrice = computeFinalPrice({
    basePrice: effectiveBase,
    minPrice: rule.minPrice,
    maxPrice: rule.maxPrice,
    demandFactor,
    qualityFactor,
  });

  const explanation = [
    `Featured placement reference $${effectiveBase.toFixed(0)} CAD.`,
    input?.city ?
      `Higher demand in ${input.city} increases placement cost within the published min/max.`
    : "City-specific demand can change this quote — pass ?city= when requesting.",
  ];

  if (input?.recordEvent !== false) {
    void prisma.lecipmPricingEvent
      .create({
        data: {
          type: MARKET_PRICING_TYPES.FEATURED,
          price: finalPrice,
          context: { city: input?.city ?? null, demandFactor, qualityFactor, signals: sig },
        },
      })
      .catch(() => {});
  }

  return {
    type: "FEATURED",
    currency: "CAD",
    basePrice: effectiveBase,
    minPrice: rule.minPrice,
    maxPrice: rule.maxPrice,
    demandFactor,
    qualityFactor,
    finalPrice: Math.round(finalPrice * 100) / 100,
    explanation,
    city: input?.city?.trim() ?? null,
  };
}
