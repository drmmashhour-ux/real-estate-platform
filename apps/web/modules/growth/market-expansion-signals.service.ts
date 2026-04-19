/**
 * Per-city expansion signals from real DB + Fast Deal rows only.
 */

import { prisma } from "@/lib/db";
import type { FastDealCityMetrics } from "@/modules/growth/fast-deal-city-comparison.types";
import { buildCityMetricsFromRows } from "@/modules/growth/fast-deal-city-metrics.service";
import { computeDerivedRates } from "@/modules/growth/fast-deal-city-derived.service";
import { normalizeFastDealCityKey } from "@/modules/growth/fast-deal-city-normalize";

export type CityExpansionSignals = {
  city: string;
  normalizedKey: string;
  metrics: FastDealCityMetrics;
  derived: ReturnType<typeof computeDerivedRates>;
  /** Demand proxy: logged lead captures + outcome lead_captured (from metrics meta rollups). */
  demandSignal?: number;
  /** Supply proxy: active FSBO listings whose city label matches (case-insensitive). */
  supplyListingCount?: number;
  /** Competition proxy: sourcing sessions + brokers_found in-window (operator activity density). */
  competitionSignal?: number;
  /** leads / max(1, supply) when both known — undefined otherwise. */
  demandSupplyRatio?: number;
};

type SourceRow = { sourceType: string; sourceSubType: string; metadataJson: unknown };
type OutcomeRow = { outcomeType: string; metadataJson: unknown };

async function countFsboSupplyForCity(cityDisplay: string): Promise<number | undefined> {
  const key = normalizeFastDealCityKey(cityDisplay);
  try {
    const groups = await prisma.fsboListing.groupBy({
      by: ["city"],
      where: { status: "ACTIVE", moderationStatus: "APPROVED" },
      _count: { _all: true },
    });
    let n = 0;
    for (const g of groups) {
      if (normalizeFastDealCityKey(g.city) === key) n += g._count._all;
    }
    return n;
  } catch {
    return undefined;
  }
}

export function computeCompetitionFromMetrics(m: FastDealCityMetrics): number | undefined {
  const ss = m.activity.sourcingSessions ?? 0;
  const bf = m.activity.brokersFound ?? 0;
  const v = ss + bf;
  if (v === 0 && ss === 0 && bf === 0) return undefined;
  return v;
}

export async function buildSignalsForCity(
  city: string,
  windowDays: number,
  events: SourceRow[],
  outcomes: OutcomeRow[],
): Promise<CityExpansionSignals> {
  const metrics = buildCityMetricsFromRows(city, windowDays, events, outcomes);
  const derived = computeDerivedRates({
    city: metrics.city,
    windowDays: metrics.windowDays,
    activity: metrics.activity,
    execution: metrics.execution,
    progression: metrics.progression,
  });

  const demand =
    metrics.activity.leadsCaptured != null && metrics.activity.leadsCaptured > 0
      ? metrics.activity.leadsCaptured
      : undefined;

  const supply = await countFsboSupplyForCity(city);
  const comp = computeCompetitionFromMetrics(metrics);

  let demandSupplyRatio: number | undefined;
  if (demand != null && supply != null && supply >= 0) {
    demandSupplyRatio = demand / Math.max(1, supply);
  }

  return {
    city,
    normalizedKey: normalizeFastDealCityKey(city),
    metrics,
    derived,
    demandSignal: demand,
    supplyListingCount: supply,
    competitionSignal: comp,
    demandSupplyRatio,
  };
}
