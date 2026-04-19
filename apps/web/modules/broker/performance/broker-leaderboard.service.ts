/**
 * Internal leaderboard ordering — confidence-aware; not for public shaming surfaces.
 */

import { prisma } from "@/lib/db";
import { scoreBrokerPerformanceMetrics } from "./broker-performance-scoring.service";
import { aggregateBrokerPerformanceMetrics } from "./broker-performance.service";
import { buildBrokerPerformanceInsights } from "./broker-performance-insights.service";
import {
  recordInsightsGenerated,
  recordLeaderboardGenerated,
} from "./broker-performance-monitoring.service";
import type { BrokerLeaderboardRow, BrokerPerformanceInsight } from "./broker-performance.types";

function pickStrengthWeakness(insights: BrokerPerformanceInsight[]): { strength: string; weakness: string } {
  const strengths = insights.filter((i) => i.type === "strength");
  const weaknesses = insights.filter((i) => i.type === "weakness" || i.type === "data_quality");
  return {
    strength: strengths[0]?.label ?? "—",
    weakness: weaknesses[0]?.label ?? "—",
  };
}

/** Exported for deterministic ordering tests. */
export function compareLeaderboardRows(a: BrokerLeaderboardRow, b: BrokerLeaderboardRow): number {
  const insA = a.band === "insufficient_data" ? 1 : 0;
  const insB = b.band === "insufficient_data" ? 1 : 0;
  if (insA !== insB) return insA - insB;
  if (b.overallScore !== a.overallScore) return b.overallScore - a.overallScore;
  return a.brokerId.localeCompare(b.brokerId);
}

export type InternalLeaderboardResult = {
  rows: BrokerLeaderboardRow[];
  topPerformers: BrokerLeaderboardRow[];
  weakestPerformers: BrokerLeaderboardRow[];
  insufficientData: BrokerLeaderboardRow[];
};

/**
 * Builds ranked rows for admin — capped broker scan; skips heavy per-row monitoring logs.
 */
export async function buildInternalBrokerLeaderboard(options?: {
  maxBrokers?: number;
}): Promise<InternalLeaderboardResult> {
  const max = Math.min(options?.maxBrokers ?? 48, 120);

  const brokers = await prisma.user.findMany({
    where: { role: "BROKER", accountStatus: "ACTIVE" },
    select: { id: true, name: true, email: true },
    take: max,
    orderBy: { createdAt: "desc" },
  });

  const rows: BrokerLeaderboardRow[] = [];
  let totalInsights = 0;
  let insufficientCount = 0;

  for (const b of brokers) {
    const raw = await aggregateBrokerPerformanceMetrics(b.id);
    if (!raw) continue;
    const metrics = scoreBrokerPerformanceMetrics(raw);
    const insights = buildBrokerPerformanceInsights(metrics);
    totalInsights += insights.length;
    if (metrics.executionBand === "insufficient_data") insufficientCount += 1;

    const { strength, weakness } = pickStrengthWeakness(insights);
    const displayName = (b.name?.trim() || b.email?.trim() || "Broker").slice(0, 120);

    rows.push({
      brokerId: b.id,
      displayName,
      overallScore: metrics.overallScore,
      band: metrics.executionBand,
      keyStrength: strength,
      keyWeakness: weakness,
    });
  }

  rows.sort(compareLeaderboardRows);

  recordLeaderboardGenerated(rows.length, insufficientCount);

  const sufficient = rows.filter((r) => r.band !== "insufficient_data");
  const insufficientData = rows.filter((r) => r.band === "insufficient_data");

  const topPerformers = sufficient.slice(0, Math.min(5, sufficient.length));
  const weakestPerformers =
    sufficient.length > 0 ? sufficient.slice(-Math.min(5, sufficient.length)).reverse() : [];

  return {
    rows,
    topPerformers,
    weakestPerformers,
    insufficientData,
  };
}
