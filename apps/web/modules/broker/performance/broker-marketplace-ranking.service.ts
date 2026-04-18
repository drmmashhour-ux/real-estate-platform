/**
 * Advisory marketplace ranking — visibility only; does not route leads or change billing.
 */

import { prisma } from "@/lib/db";
import { buildBrokerPerformanceSummary } from "./broker-performance.service";
import { recordRankingsBuilt } from "./broker-performance-monitoring.service";
import type { BrokerMarketplaceRanking } from "./broker-performance.types";

export function sortMarketplaceRankings(rows: BrokerMarketplaceRanking[]): BrokerMarketplaceRanking[] {
  return [...rows].sort((a, b) => b.rankScore - a.rankScore || a.brokerId.localeCompare(b.brokerId));
}

export async function buildBrokerMarketplaceRankings(): Promise<BrokerMarketplaceRanking[]> {
  const brokers = await prisma.user.findMany({
    where: { role: "BROKER" },
    select: { id: true },
    orderBy: { id: "asc" },
    take: 200,
  });

  const rows: BrokerMarketplaceRanking[] = [];

  for (const b of brokers) {
    const summary = await buildBrokerPerformanceSummary(b.id);
    if (!summary) continue;
    const why: string[] = [];
    for (const s of summary.strongSignals.slice(0, 2)) why.push(s);
    if (why.length === 0) {
      why.push(`Overall score ${summary.overallScore} — in-sample CRM + billing signals.`);
    }
    why.push(`Band: ${summary.band} (advisory)`);
    rows.push({
      brokerId: b.id,
      rankScore: summary.overallScore,
      band: summary.band,
      why,
    });
  }

  const sorted = sortMarketplaceRankings(rows);
  recordRankingsBuilt(sorted.length);
  return sorted;
}
