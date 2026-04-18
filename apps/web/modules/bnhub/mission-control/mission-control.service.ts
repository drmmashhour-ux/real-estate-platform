/**
 * BNHub Mission Control V1 — orchestrates snapshot → analysis → recommendations → status (read-only).
 */

import type { BNHubMissionControlSummary } from "./mission-control.types";
import { buildBNHubMissionControlSnapshot } from "./mission-control-snapshot.service";
import { analyzeBNHubMissionControl } from "./mission-control-analyzer.service";
import { buildMissionControlRecommendations } from "./mission-control-recommendations.service";
import { classifyMissionControlStatus } from "./mission-control-status.service";
import { recordMissionControlBuilt } from "./mission-control-monitoring.service";

function trustDisplayScore(trustBreakdown?: number, reviewCount?: number): number | undefined {
  if (trustBreakdown == null && (reviewCount ?? 0) === 0) return undefined;
  const t = Math.min(100, Math.max(0, (trustBreakdown ?? 0) * 5));
  const bonus = Math.min(20, (reviewCount ?? 0) * 2);
  return Math.round(Math.min(100, t + bonus));
}

/**
 * Full mission-control summary for a listing (advisory; no mutations).
 */
export async function buildBNHubMissionControl(listingId: string): Promise<BNHubMissionControlSummary> {
  const snap = await buildBNHubMissionControlSnapshot(listingId);
  const createdAt = new Date().toISOString();

  if (!snap) {
    const empty: BNHubMissionControlSummary = {
      listingId,
      status: "weak",
      weakSignals: ["Listing not found"],
      strongSignals: [],
      topRisks: [],
      topOpportunities: [],
      recommendations: [],
      createdAt,
    };
    try {
      recordMissionControlBuilt({ status: "weak", risks: 1, opportunities: 0 });
    } catch {
      /* */
    }
    return empty;
  }

  const analysis = analyzeBNHubMissionControl(snap);
  const recommendations = buildMissionControlRecommendations({ snapshot: snap, analysis });

  const partial: BNHubMissionControlSummary = {
    listingId: snap.listingId,
    rankingScore: snap.rankingFinalScore,
    hostStatus: snap.hostListingStatus,
    guestConversionStatus: snap.guestConversionStatus,
    bookingHealth: snap.bookingHealth,
    trustScore: trustDisplayScore(snap.trustScoreBreakdown, snap.reviewCount),
    pricingSignal: snap.pricingSignalLabel,
    weakSignals: analysis.weakSignals,
    strongSignals: analysis.strongSignals,
    topRisks: analysis.topRisks.slice(0, 4),
    topOpportunities: analysis.topOpportunities.slice(0, 4),
    recommendations: recommendations.slice(0, 8),
    createdAt: snap.createdAt,
  };

  const status = classifyMissionControlStatus(partial);

  try {
    recordMissionControlBuilt({
      status,
      risks: partial.topRisks.length,
      opportunities: partial.topOpportunities.length,
    });
  } catch {
    /* */
  }

  return { ...partial, status, createdAt: snap.createdAt };
}
