/**
 * Deterministic advisory recommendations — capped, no guarantee language.
 */

import type { BNHubMissionControlRawSnapshot } from "./mission-control.types";
import type { MissionControlAnalysis } from "./mission-control-analyzer.service";
import type { BNHubMissionControlRecommendation } from "./mission-control.types";

let _seq = 0;
function nextId(prefix: string): string {
  _seq += 1;
  return `${prefix}_${_seq}`;
}

export function resetMissionControlRecommendationIdsForTests(): void {
  _seq = 0;
}

export function buildMissionControlRecommendations(input: {
  snapshot: BNHubMissionControlRawSnapshot;
  analysis: MissionControlAnalysis;
}): BNHubMissionControlRecommendation[] {
  const { snapshot, analysis } = input;
  const out: BNHubMissionControlRecommendation[] = [];

  const rank = snapshot.rankingFinalScore ?? 0;
  const gc = snapshot.guestConversionStatus;
  const views = snapshot.guestMetrics?.listingViews ?? 0;
  const paid = snapshot.guestMetrics?.bookingCompletions ?? 0;

  if (rank >= 55 && (gc === "weak" || gc === "watch")) {
    out.push({
      id: nextId("mc"),
      title: "Improve hero photos and first-screen clarity",
      description:
        "Strong ranking but conversion lags — refresh lead imagery and headline so search intent matches the listing story (manual edits only).",
      impact: "high",
      why: "Ranking and conversion are misaligned in the snapshot — typical fix is creative, not automatic repricing.",
    });
  }

  if (views >= 15 && paid === 0) {
    out.push({
      id: nextId("mc"),
      title: "Review booking friction before scaling traffic",
      description:
        "Guests view the listing but rarely complete paid steps — walk the booking path and confirm fees, policies, and errors are clear.",
      impact: "high",
      why: "Advisory funnel signal from BNHub client events; does not change Stripe or checkout code.",
    });
  }

  if ((snapshot.trustScoreBreakdown ?? 0) < 10 && snapshot.reviewCount < 3) {
    out.push({
      id: nextId("mc"),
      title: "Increase trust signals (reviews, verification)",
      description:
        "Prompt completed guests for reviews and complete verification surfaces — no guarantee of ranking movement.",
      impact: "medium",
      why: "Trust subscore is low relative to opportunity.",
    });
  }

  if ((snapshot.rankingBreakdown?.priceCompetitivenessScore ?? 0) < 11) {
    out.push({
      id: nextId("mc"),
      title: "Review pricing vs similar stays",
      description:
        "Pricing signal vs cohort is soft — compare nightly bands manually; this layer never auto-adjusts rates.",
      impact: "medium",
      why: "Heuristic from ranking price competitiveness subscore.",
    });
  }

  if (analysis.topRisks.some((r) => r.includes("trust"))) {
    out.push({
      id: nextId("mc"),
      title: "Close the trust gap before heavy promotion",
      description: "Prioritize social proof and host responsiveness so paid traffic does not amplify skepticism.",
      impact: "medium",
      why: "Analyzer flagged trust vs demand tension.",
    });
  }

  const dedup = new Map<string, BNHubMissionControlRecommendation>();
  for (const r of out) {
    if (!dedup.has(r.title)) dedup.set(r.title, r);
  }
  return [...dedup.values()].slice(0, 8);
}
