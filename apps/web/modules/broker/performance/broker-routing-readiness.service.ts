/**
 * Advisory routing readiness — preparation only; no routing or access changes.
 */

import type { BrokerMarketplaceRanking, BrokerRoutingReadinessSummary } from "./broker-performance.types";
import { buildBrokerMarketplaceRankings } from "./broker-marketplace-ranking.service";

export function summarizeRoutingReadinessFromRankings(rankings: BrokerMarketplaceRanking[]): BrokerRoutingReadinessSummary {
  const totalBrokersScored = rankings.length;
  const highQualityBrokers = rankings.filter((r) => r.band === "strong").length;
  const needsImprovementBrokers = rankings.filter((r) => r.band === "low" || r.band === "watch").length;

  const notes: string[] = [
    "Read-only snapshot — no automatic lead assignment is active in V1.",
    "Use rankings for internal visibility and future experiments only.",
  ];

  const routingExperimentsAdvisable = totalBrokersScored >= 20 && highQualityBrokers >= 3;

  if (totalBrokersScored < 10) {
    notes.push("Low broker count — wait for more data before trusting cohort-level routing decisions.");
  }

  return {
    highQualityBrokers,
    needsImprovementBrokers,
    totalBrokersScored,
    routingExperimentsAdvisable,
    notes,
  };
}

/** Fetches rankings then derives readiness (two steps; use bundle API to avoid duplicate ranking in one request). */
export async function buildBrokerRoutingReadinessSummary(): Promise<BrokerRoutingReadinessSummary> {
  const rankings = await buildBrokerMarketplaceRankings();
  return summarizeRoutingReadinessFromRankings(rankings);
}
