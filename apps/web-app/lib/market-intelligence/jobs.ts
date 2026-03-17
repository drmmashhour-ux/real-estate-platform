/**
 * Market analytics jobs – run index computation and report generation.
 * Can be scheduled (cron) or triggered via API.
 */

import { prisma } from "@/lib/db";
import { listRegions } from "./regions";
import { computePriceIndexForRegion, upsertPriceIndex } from "./price-index";
import { computeRentIndexForRegion, upsertRentIndex } from "./rent-index";
import { computeBnhubIndexForRegion, upsertBnhubIndex } from "./bnhub-index";
import { computeDemandMetricsForRegion, upsertDemandMetrics } from "./demand";
import { computeInvestmentScoreForProperty, upsertInvestmentScore } from "./investment";
import { generateReportForRegion } from "./reports";

function currentPeriodMonthly(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Run price index for all regions for the given period (default: current month). */
export async function jobPriceIndexUpdate(period?: string): Promise<{ updated: number; errors: string[] }> {
  const p = period ?? currentPeriodMonthly();
  const regions = await listRegions();
  const errors: string[] = [];
  let updated = 0;
  for (const r of regions) {
    try {
      const data = await computePriceIndexForRegion(r.id, p);
      await upsertPriceIndex(r.id, p, {
        averagePrice: data.averagePrice,
        medianPrice: data.medianPrice,
        trendDirection: data.trendDirection,
        sampleSize: data.sampleSize,
      });
      updated++;
    } catch (e) {
      errors.push(`${r.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return { updated, errors };
}

/** Run rent index for all regions. */
export async function jobRentIndexUpdate(period?: string): Promise<{ updated: number; errors: string[] }> {
  const p = period ?? currentPeriodMonthly();
  const regions = await listRegions();
  const errors: string[] = [];
  let updated = 0;
  for (const r of regions) {
    try {
      const data = await computeRentIndexForRegion(r.id, p);
      await upsertRentIndex(r.id, p, {
        averageRent: data.averageRent,
        medianRent: data.medianRent,
        trendDirection: data.trendDirection,
        sampleSize: data.sampleSize,
      });
      updated++;
    } catch (e) {
      errors.push(`${r.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return { updated, errors };
}

/** Run BNHub index for all regions. */
export async function jobBnhubIndexUpdate(period?: string): Promise<{ updated: number; errors: string[] }> {
  const p = period ?? currentPeriodMonthly();
  const regions = await listRegions();
  const errors: string[] = [];
  let updated = 0;
  for (const r of regions) {
    try {
      const data = await computeBnhubIndexForRegion(r.id, p);
      await upsertBnhubIndex(r.id, p, {
        averageNightlyRate: data.averageNightlyRate,
        averageOccupancy: data.averageOccupancy,
        averageMonthlyRevenue: data.averageMonthlyRevenue,
        averageRating: data.averageRating,
        sampleSize: data.sampleSize,
      });
      updated++;
    } catch (e) {
      errors.push(`${r.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return { updated, errors };
}

/** Run demand metrics for all regions. */
export async function jobDemandUpdate(period?: string): Promise<{ updated: number; errors: string[] }> {
  const p = period ?? currentPeriodMonthly();
  const regions = await listRegions();
  const errors: string[] = [];
  let updated = 0;
  for (const r of regions) {
    try {
      const data = await computeDemandMetricsForRegion(r.id, p);
      await upsertDemandMetrics(r.id, p, {
        demandScore: data.demandScore,
        searchVolume: data.searchVolume,
        bookingVolume: data.bookingVolume,
        inventoryLevel: data.inventoryLevel,
      });
      updated++;
    } catch (e) {
      errors.push(`${r.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return { updated, errors };
}

/** Run investment scoring for properties that have a market region. */
export async function jobInvestmentScoring(): Promise<{ updated: number; errors: string[] }> {
  const properties = await prisma.propertyIdentity.findMany({
    where: { marketRegionId: { not: null } },
    select: { id: true, marketRegionId: true },
  });
  const errors: string[] = [];
  let updated = 0;
  for (const p of properties) {
    if (!p.marketRegionId) continue;
    try {
      const data = await computeInvestmentScoreForProperty(p.id, p.marketRegionId);
      await upsertInvestmentScore(p.id, p.marketRegionId, data);
      updated++;
    } catch (e) {
      errors.push(`${p.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return { updated, errors };
}

/** Generate market reports for all regions for the given period. */
export async function jobMarketReports(period?: string): Promise<{ updated: number; errors: string[] }> {
  const p = period ?? currentPeriodMonthly();
  const regions = await listRegions();
  const errors: string[] = [];
  let updated = 0;
  for (const r of regions) {
    try {
      const report = await generateReportForRegion(r.id, p);
      if (report) updated++;
    } catch (e) {
      errors.push(`${r.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return { updated, errors };
}

/** Run all weekly analytics (price, rent, BNHub, demand, then reports). */
export async function runWeeklyAnalytics(period?: string) {
  const p = period ?? currentPeriodMonthly();
  const [price, rent, bnhub, demand, reports] = await Promise.all([
    jobPriceIndexUpdate(p),
    jobRentIndexUpdate(p),
    jobBnhubIndexUpdate(p),
    jobDemandUpdate(p),
    jobMarketReports(p),
  ]);
  return { price, rent, bnhub, demand, reports };
}

/** Run monthly investment scoring. */
export async function runMonthlyInvestmentScoring() {
  return jobInvestmentScoring();
}
