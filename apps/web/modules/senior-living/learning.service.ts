/**
 * Explainable weight nudges for senior matching — conservative, capped, data-gated.
 * Never replaces rule-based matching; only adjusts dimensional emphasis within ±10% of defaults.
 */
import { prisma } from "@/lib/db";
import { computeFunnelRates, getResidenceFunnelCounts, type ResidenceFunnelCounts } from "./matching-events.service";

export const DEFAULT_WEIGHTS = {
  careWeight: 0.35,
  budgetWeight: 0.25,
  locationWeight: 0.2,
  serviceWeight: 0.2,
} as const;

/** Minimum funnel events before weight learning runs (guardrail). */
export const LEARNING_MIN_EVENTS = 100;

/** Require enough residences with measurable conversion to correlate. */
export const LEARNING_MIN_RESIDENCES = 12;

const CARE_ORDER = ["AUTONOMOUS", "SEMI_AUTONOMOUS", "ASSISTED", "FULL_CARE"] as const;

function careRank(level: string): number {
  const i = CARE_ORDER.indexOf(level as (typeof CARE_ORDER)[number]);
  return i >= 0 ? i : 0;
}

function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

/** Pearson correlation in [-1, 1]; returns 0 if undefined. */
export function pearsonCorrelation(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n !== ys.length || n < 5) return 0;
  const mx = mean(xs);
  const my = mean(ys);
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    const vx = xs[i]! - mx;
    const vy = ys[i]! - my;
    num += vx * vy;
    dx += vx * vx;
    dy += vy * vy;
  }
  const den = Math.sqrt(dx) * Math.sqrt(dy);
  if (den < 1e-9) return 0;
  return Math.max(-1, Math.min(1, num / den));
}

function clampToBaseline(value: number, baseline: number, maxRelativeDelta = 0.1): number {
  const lo = baseline * (1 - maxRelativeDelta);
  const hi = baseline * (1 + maxRelativeDelta);
  return Math.min(hi, Math.max(lo, value));
}

function normalizeWeights(w: {
  careWeight: number;
  budgetWeight: number;
  locationWeight: number;
  serviceWeight: number;
}): { careWeight: number; budgetWeight: number; locationWeight: number; serviceWeight: number } {
  const s = w.careWeight + w.budgetWeight + w.locationWeight + w.serviceWeight;
  if (s < 1e-9) return { ...DEFAULT_WEIGHTS };
  return {
    careWeight: w.careWeight / s,
    budgetWeight: w.budgetWeight / s,
    locationWeight: w.locationWeight / s,
    serviceWeight: w.serviceWeight / s,
  };
}

export async function getOrCreateMatchingWeights() {
  const existing = await prisma.matchingWeight.findFirst({ orderBy: { updatedAt: "desc" } });
  if (existing) return existing;
  return prisma.matchingWeight.create({
    data: { ...DEFAULT_WEIGHTS },
  });
}

function midPrice(basePrice: number | null, minP: number | null, maxP: number | null): number | null {
  if (minP != null && maxP != null) return (minP + maxP) / 2;
  return basePrice;
}

export type LearningRunResult = {
  ran: boolean;
  skippedReason?: string;
  totalEvents: number;
  weights?: {
    careWeight: number;
    budgetWeight: number;
    locationWeight: number;
    serviceWeight: number;
  };
  notes: string[];
};

/**
 * Adjust weights using outcome correlations (small steps). Invoked by cron or after enough new events.
 */
export async function runMatchingLearning(): Promise<LearningRunResult> {
  const notes: string[] = [];
  const totalEvents = await prisma.matchingEvent.count();
  if (totalEvents < LEARNING_MIN_EVENTS) {
    return {
      ran: false,
      skippedReason: `Need at least ${LEARNING_MIN_EVENTS} events (have ${totalEvents}).`,
      totalEvents,
      notes,
    };
  }

  const residences = await prisma.seniorResidence.findMany({
    select: {
      id: true,
      careLevel: true,
      basePrice: true,
      priceRangeMin: true,
      priceRangeMax: true,
      verified: true,
    },
  });

  type Row = {
    id: string;
    care: number;
    price: number | null;
    verified: number;
    convRate: number;
    funnel: ResidenceFunnelCounts;
  };

  const rows: Row[] = [];
  for (const r of residences) {
    const funnel = await getResidenceFunnelCounts(r.id);
    const { conversionRate } = computeFunnelRates(funnel);
    const price = midPrice(r.basePrice, r.priceRangeMin, r.priceRangeMax);
    rows.push({
      id: r.id,
      care: careRank(r.careLevel),
      price: price,
      verified: r.verified ? 1 : 0,
      convRate: conversionRate,
      funnel,
    });
  }

  const usable = rows.filter((x) => x.funnel.leads >= 1 || x.funnel.views >= 6);
  if (usable.length < LEARNING_MIN_RESIDENCES) {
    return {
      ran: false,
      skippedReason: `Need at least ${LEARNING_MIN_RESIDENCES} residences with measurable funnel (have ${usable.length}).`,
      totalEvents,
      notes,
    };
  }

  const careXs = usable.map((x) => x.care);
  const careYs = usable.map((x) => x.convRate);
  const corrCare = pearsonCorrelation(careXs, careYs);

  const priceVals = usable.map((x) => x.price).filter((p): p is number => p != null && Number.isFinite(p));
  const medianPrice =
    priceVals.length === 0 ? null : [...priceVals].sort((a, b) => a - b)[Math.floor(priceVals.length / 2)]!;
  const budgetXs = usable.map((x) => {
    if (x.price == null || medianPrice == null) return 0;
    return -Math.abs(x.price - medianPrice);
  });
  const corrBudget = medianPrice != null ? pearsonCorrelation(budgetXs, usable.map((x) => x.convRate)) : 0;

  const verXs = usable.map((x) => x.verified);
  const corrService = pearsonCorrelation(verXs, usable.map((x) => x.convRate));

  /** Location proxy: correlation between conversion and “repeat attention” (clicks per view). */
  const locXs = usable.map((x) => {
    const v = x.funnel.views + 1;
    const c = x.funnel.clicks + 0.5;
    return Math.min(1, c / v);
  });
  const corrLocation = pearsonCorrelation(locXs, usable.map((x) => x.convRate));

  const STEP = 0.015;
  let w = await getOrCreateMatchingWeights();

  let careWeight = w.careWeight + STEP * corrCare;
  let budgetWeight = w.budgetWeight + STEP * corrBudget;
  let locationWeight = w.locationWeight + STEP * corrLocation;
  let serviceWeight = w.serviceWeight + STEP * corrService;

  careWeight = clampToBaseline(careWeight, DEFAULT_WEIGHTS.careWeight);
  budgetWeight = clampToBaseline(budgetWeight, DEFAULT_WEIGHTS.budgetWeight);
  locationWeight = clampToBaseline(locationWeight, DEFAULT_WEIGHTS.locationWeight);
  serviceWeight = clampToBaseline(serviceWeight, DEFAULT_WEIGHTS.serviceWeight);

  const normalized = normalizeWeights({ careWeight, budgetWeight, locationWeight, serviceWeight });

  const updated = await prisma.matchingWeight.update({
    where: { id: w.id },
    data: {
      careWeight: normalized.careWeight,
      budgetWeight: normalized.budgetWeight,
      locationWeight: normalized.locationWeight,
      serviceWeight: normalized.serviceWeight,
    },
  });

  notes.push(
    `Correlations (Pearson): care ${corrCare.toFixed(3)}, budget ${corrBudget.toFixed(3)}, location ${corrLocation.toFixed(3)}, service/verified ${corrService.toFixed(3)}.`
  );
  notes.push("Weights renormalized to sum to 1 and clamped within ±10% of defaults per dimension.");

  return {
    ran: true,
    totalEvents,
    weights: {
      careWeight: updated.careWeight,
      budgetWeight: updated.budgetWeight,
      locationWeight: updated.locationWeight,
      serviceWeight: updated.serviceWeight,
    },
    notes,
  };
}
