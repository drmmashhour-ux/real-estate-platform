/**
 * Read-only history + trends for ads automation loop runs.
 */

import { prisma } from "@/lib/db";
import type { AdsAutomationLoopRunRecord } from "./ads-automation-v4.types";
import { getLoopRunHistory, mapAdsAutomationLoopRunRow } from "./ads-automation-persistence.service";

export async function listAdsAutomationLoopRuns(limit = 20): Promise<AdsAutomationLoopRunRecord[]> {
  return getLoopRunHistory(limit);
}

export async function getAdsAutomationLoopRunDetails(id: string): Promise<{
  run: AdsAutomationLoopRunRecord;
  campaigns: unknown[];
  recommendations: unknown[];
  landingInsights: unknown[];
} | null> {
  const row = await prisma.adsAutomationLoopRun.findUnique({
    where: { id },
    include: {
      campaignResults: true,
      recommendations: true,
      landingInsights: true,
    },
  });
  if (!row) return null;
  return {
    run: mapAdsAutomationLoopRunRow(row),
    campaigns: row.campaignResults,
    recommendations: row.recommendations,
    landingInsights: row.landingInsights,
  };
}

export async function getAdsAutomationTrendSummary(): Promise<{
  runCount: number;
  avgConfidence: number | null;
  avgWinners: number;
  avgWeak: number;
  recommendationTypeCounts: Record<string, number>;
  sampleSize: number;
}> {
  const rows = await prisma.adsAutomationLoopRun.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { recommendations: { select: { recommendationType: true } } },
  });
  if (rows.length === 0) {
    return {
      runCount: 0,
      avgConfidence: null,
      avgWinners: 0,
      avgWeak: 0,
      recommendationTypeCounts: {},
      sampleSize: 0,
    };
  }
  let confSum = 0;
  let confN = 0;
  let winSum = 0;
  let weakSum = 0;
  const typeCounts: Record<string, number> = {};
  for (const r of rows) {
    if (r.confidence != null) {
      confSum += r.confidence;
      confN += 1;
    }
    winSum += r.winnersCount;
    weakSum += r.weakCount;
    for (const rec of r.recommendations) {
      typeCounts[rec.recommendationType] = (typeCounts[rec.recommendationType] ?? 0) + 1;
    }
  }
  return {
    runCount: rows.length,
    avgConfidence: confN ? confSum / confN : null,
    avgWinners: winSum / rows.length,
    avgWeak: weakSum / rows.length,
    recommendationTypeCounts: typeCounts,
    sampleSize: rows.length,
  };
}
