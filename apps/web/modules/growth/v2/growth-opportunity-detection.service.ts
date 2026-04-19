/**
 * Deterministic opportunity hypotheses — advisory; evidence strings only from inputs.
 */

import type { BookingFunnelAnalysis } from "@/modules/growth/booking-funnel-analysis.service";
import type { PlatformStatsResult } from "@/modules/analytics/services/get-platform-stats";
import type { GrowthConfidence, GrowthOpportunity, GrowthOpportunityCategory, GrowthSeverity } from "./growth-engine-v2.types";
import type { GrowthBrokerBridgeSnapshot } from "./growth-broker-bridge.service";

/** Shared input bundle for detectors — kept here to avoid circular imports with risk detection. */
export type OpportunitySignalPack = {
  platform: PlatformStatsResult | null;
  funnel: BookingFunnelAnalysis | null;
  broker: GrowthBrokerBridgeSnapshot | null;
  followUpDebtRatio: number | null;
  notes: string[];
};

function opp(
  id: string,
  category: GrowthOpportunityCategory,
  title: string,
  description: string,
  urgency: GrowthSeverity,
  impact: GrowthSeverity,
  confidence: GrowthConfidence,
  recommendedAction: string,
  sourceSignals: string[],
): GrowthOpportunity {
  return {
    id,
    category,
    title,
    description,
    urgency,
    impact,
    confidence,
    recommendedAction,
    sourceSignals,
  };
}

export function detectGrowthOpportunities(pack: OpportunitySignalPack): GrowthOpportunity[] {
  const out: GrowthOpportunity[] = [];

  const visitors = pack.platform?.totals.visitors ?? 0;
  const listings = pack.platform?.totals.listingsTotal ?? 0;
  const txs = pack.platform?.totals.transactionsClosed ?? 0;

  if (pack.platform && visitors >= 500 && listings > 0) {
    const attach = txs / Math.max(1, listings);
    if (attach < 0.02) {
      out.push(
        opp(
          "opp-traffic-conv",
          "conversion",
          "Traffic present but closing attachment looks thin",
          `Visitors ${visitors} vs listings ${listings} — closed transactions ${txs}. Directional funnel gap (not causal proof).`,
          "medium",
          "high",
          visitors > 2000 ? "medium" : "low",
          "Review listing→offer friction on priority cities; validate checkout instrumentation.",
          [`visitors=${visitors}`, `transactionsClosed=${txs}`, `listingsTotal=${listings}`],
        ),
      );
    }
  }

  const funnel = pack.funnel;
  if (funnel && funnel.counts.bookingStarted >= 8) {
    const completionRate =
      funnel.counts.bookingStarted > 0 ? funnel.counts.bookingCompleted / funnel.counts.bookingStarted : 0;
    if (completionRate < 0.35) {
      out.push(
        opp(
          "opp-bnhub-complete",
          "bnhub",
          "BNHub bookings start but completion is soft",
          `Started ${funnel.counts.bookingStarted}, completed ${funnel.counts.bookingCompleted} in window — checkout/payment hygiene review.`,
          "high",
          "medium",
          funnel.counts.bookingCompleted >= 3 ? "medium" : "low",
          "Inspect checkout drops and trust cues on BNHub surfaces — no automated retries.",
          [
            `booking_started=${funnel.counts.bookingStarted}`,
            `booking_completed=${funnel.counts.bookingCompleted}`,
            `bottleneck=${funnel.bottleneck}`,
          ],
        ),
      );
    }
  }

  if (pack.followUpDebtRatio != null && pack.followUpDebtRatio >= 0.35) {
    out.push(
      opp(
        "opp-broker-followup",
        "broker",
        "Broker follow-up backlog signal",
        `Contact-heavy pipeline share ~${Math.round(pack.followUpDebtRatio * 100)}% on sampled rows — cadence coaching may unlock conversion.`,
        "medium",
        "medium",
        pack.followUpDebtRatio >= 0.5 ? "medium" : "low",
        "Use broker coaching workspace — prioritize contacted-first sweeps.",
        [`contacted_share_heuristic=${pack.followUpDebtRatio.toFixed(2)}`],
      ),
    );
  }

  const b = pack.broker;
  if (b && !b.sparse && b.avgOverallScore != null && b.avgOverallScore >= 62 && b.weakBandShare != null && b.weakBandShare <= 0.15) {
    out.push(
      opp(
        "opp-broker-momentum",
        "broker",
        "Broker execution cohort looks healthy",
        `Mean score ~${b.avgOverallScore} with contained weak-band share — replicate habits via optional shadowing.`,
        "low",
        "medium",
        "medium",
        "Capture 2–3 repeatable plays (response + meeting progression) internally — voluntary participation.",
        [`avgOverallScore=${b.avgOverallScore}`, `weakBandShare=${(b.weakBandShare ?? 0).toFixed(2)}`],
      ),
    );
  }

  if (funnel?.croEngineHints?.dominantIssue && funnel.croEngineHints.dominantIssue !== "none") {
    out.push(
      opp(
        "opp-cro-hint",
        "conversion",
        "CRO hint flagged a dominant issue",
        funnel.croEngineHints.reason,
        "medium",
        "medium",
        "low",
        "Review the cited surface with design/product — fixes are manual.",
        [`cro_issue=${funnel.croEngineHints.dominantIssue}`],
      ),
    );
  }

  out.sort((a, b) => {
    const uk = (u: GrowthSeverity) => (u === "high" ? 0 : u === "medium" ? 1 : 2);
    if (uk(a.urgency) !== uk(b.urgency)) return uk(a.urgency) - uk(b.urgency);
    return a.id.localeCompare(b.id);
  });

  return out.slice(0, 12);
}
