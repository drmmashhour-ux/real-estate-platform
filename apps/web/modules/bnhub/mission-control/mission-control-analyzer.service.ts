/**
 * Pattern detection on mission-control snapshot — deterministic, advisory.
 */

import type { BNHubMissionControlRawSnapshot } from "./mission-control.types";

export type MissionControlAnalysis = {
  weakSignals: string[];
  strongSignals: string[];
  topRisks: string[];
  topOpportunities: string[];
};

export function analyzeBNHubMissionControl(snapshot: BNHubMissionControlRawSnapshot): MissionControlAnalysis {
  const weakSignals: string[] = [...snapshot.hostWeakSignals, ...snapshot.guestConversionWeakSignals];
  const strongSignals: string[] = [...snapshot.hostStrongSignals];
  const topRisks: string[] = [];
  const topOpportunities: string[] = [];

  const rank = snapshot.rankingFinalScore ?? 0;
  const gc = snapshot.guestConversionStatus;
  const host = snapshot.hostListingStatus;
  const views = snapshot.guestMetrics?.listingViews ?? 0;
  const starts = snapshot.guestMetrics?.bookingStarts ?? 0;
  const paid = snapshot.guestMetrics?.bookingCompletions ?? 0;
  const trust = snapshot.trustScoreBreakdown ?? 0;
  const price = snapshot.rankingBreakdown?.priceCompetitivenessScore ?? 0;
  const quality = snapshot.rankingBreakdown?.qualityScore ?? 0;

  if (rank >= 60 && (gc === "weak" || gc === "watch")) {
    topRisks.push("Strong ranking score but guest conversion is not healthy — review listing UX and trust before scaling traffic.");
  }

  if (views >= 20 && paid === 0 && starts <= 1) {
    topRisks.push("High tracked views with almost no bookings — demand may be leaking at listing or checkout (advisory).");
  }

  if (trust < 10 && views >= 10) {
    topRisks.push("Demand signals exist but trust score is thin — prioritize reviews and verification.");
  }

  if (rank >= 55 && price < 10) {
    topRisks.push("Ranking looks reasonable but pricing signal is weak vs cohort — consider competitiveness (manual decision).");
  }

  if (quality < 8 && rank >= 50) {
    topRisks.push("Incomplete content vs visible ranking — guests may bounce when detail does not match discovery promise.");
  }

  if (host === "strong" && gc === "healthy" && snapshot.bookingHealth === "strong") {
    topOpportunities.push("Systems aligned — safe to test incremental discovery investment (no auto-spend).");
  }

  if (snapshot.reviewCount >= 5 && trust >= 12 && gc === "watch") {
    topOpportunities.push("Trust foundation exists — focus on conversion friction and calendar/pricing clarity.");
  }

  if (paid >= 1 && rank < 50) {
    topOpportunities.push("Paid stays occurring — improve ranking inputs (photos, freshness) to compound visibility.");
  }

  return {
    weakSignals: [...new Set(weakSignals)].slice(0, 10),
    strongSignals: [...new Set(strongSignals)].slice(0, 8),
    topRisks: [...new Set(topRisks)].slice(0, 6),
    topOpportunities: [...new Set(topOpportunities)].slice(0, 6),
  };
}
