/**
 * Daily-style briefing cards from current + delta comparison — max 8, real metrics only.
 */
import type { CompanyCommandCenterV3Payload } from "@/modules/control-center-v3/company-command-center-v3.types";
import type { CommandCenterBriefingCard, CommandCenterBriefingSeverity } from "../company-command-center-v4.types";

let cid = 0;
function cardId(): string {
  cid += 1;
  return `brief-${cid}`;
}

export function buildBriefingCards(
  current: CompanyCommandCenterV3Payload | null,
  previous: CompanyCommandCenterV3Payload | null,
): { cards: CommandCenterBriefingCard[] } {
  cid = 0;
  const cards: CommandCenterBriefingCard[] = [];
  if (!current?.shared.systems) {
    return { cards: [] };
  }

  const s = current.shared.systems;

  if (previous?.shared.systems) {
    const p = previous.shared.systems;
    const fr = numDelta(p.brain.fallbackRatePct, s.brain.fallbackRatePct);
    if (fr) {
      cards.push({
        id: cardId(),
        title: "Brain fallback rate",
        severity: severityForNumericBad(fr.curr, fr.prev, true),
        summary: `Fallback rate ${fr.prev}% → ${fr.curr}%`,
        systemsInvolved: ["brain"],
        keyMetrics: { prev: fr.prev, curr: fr.curr },
        recommendedFocus: "Review Brain shadow/primary alignment if rate worsens.",
        notes: null,
      });
    }

    const risky = numDelta(p.ads.pctRunsRisky, s.ads.pctRunsRisky);
    if (risky) {
      cards.push({
        id: cardId(),
        title: "Ads risky run share",
        severity: severityForNumericBad(risky.curr, risky.prev, true),
        summary: `Risky runs ${risky.prev}% → ${risky.curr}%`,
        systemsInvolved: ["ads"],
        keyMetrics: { prev: risky.prev, curr: risky.curr },
        recommendedFocus: s.ads.anomalyNote ?? null,
        notes: null,
      });
    }

    const od = numDelta(p.platformCore.overdueSchedules, s.platformCore.overdueSchedules);
    if (od) {
      cards.push({
        id: cardId(),
        title: "Platform overdue schedules",
        severity: od.curr > od.prev ? "warning" : "info",
        summary: `Overdue ${od.prev} → ${od.curr}`,
        systemsInvolved: ["platform_core"],
        keyMetrics: { prev: od.prev, curr: od.curr },
        recommendedFocus: "Clear scheduler backlog if overdue increased.",
        notes: null,
      });
    }

    const sw = numDelta(p.swarm.conflictCount, s.swarm.conflictCount);
    if (sw) {
      cards.push({
        id: cardId(),
        title: "Swarm conflicts",
        severity: sw.curr > sw.prev ? "watch" : "info",
        summary: `Conflicts ${sw.prev} → ${sw.curr}`,
        systemsInvolved: ["swarm"],
        keyMetrics: { prev: sw.prev, curr: sw.curr },
        recommendedFocus: null,
        notes: null,
      });
    }

    const fu = numDelta(p.fusion.conflictCount, s.fusion.conflictCount);
    if (fu) {
      cards.push({
        id: cardId(),
        title: "Fusion conflicts",
        severity: fu.curr > fu.prev ? "warning" : "info",
        summary: `Fusion conflicts ${fu.prev} → ${fu.curr}`,
        systemsInvolved: ["fusion"],
        keyMetrics: { prev: fu.prev, curr: fu.curr },
        recommendedFocus: s.fusion.agreementHint,
        notes: null,
      });
    }

    const rk = numDelta(p.ranking.totalScore, s.ranking.totalScore);
    if (rk) {
      cards.push({
        id: cardId(),
        title: "Ranking total score",
        severity: rk.curr >= rk.prev ? "info" : "watch",
        summary: `Score ${rk.prev} → ${rk.curr}`,
        systemsInvolved: ["ranking"],
        keyMetrics: { prev: rk.prev, curr: rk.curr },
        recommendedFocus: s.ranking.recommendation,
        notes: null,
      });
    }
  } else {
    cards.push({
      id: cardId(),
      title: "Baseline",
      severity: "info",
      summary: "Prior window snapshot unavailable — intra-day briefing from current signals only.",
      systemsInvolved: [],
      keyMetrics: {},
      recommendedFocus: "Enable historical window compare by ensuring prior aggregate loads.",
      notes: null,
    });
  }

  if (s.cro.topBottleneck && cards.length < 8) {
    cards.push({
      id: cardId(),
      title: "CRO bottleneck",
      severity: "watch",
      summary: s.cro.topBottleneck,
      systemsInvolved: ["cro"],
      keyMetrics: { healthScore: s.cro.healthScore },
      recommendedFocus: s.cro.readinessNote,
      notes: s.cro.dropoffSummary,
    });
  }

  return { cards: cards.slice(0, 8) };
}

function numDelta(prev: number | null, curr: number | null): { prev: number; curr: number } | null {
  if (prev == null || curr == null) return null;
  if (prev === curr) return null;
  return { prev, curr };
}

function severityForNumericBad(curr: number, prev: number, higherIsBad: boolean): CommandCenterBriefingSeverity {
  if (curr === prev) return "info";
  const worse = higherIsBad ? curr > prev : curr < prev;
  const delta = Math.abs(curr - prev);
  if (!worse) return "info";
  if (delta >= 10) return "warning";
  return "watch";
}
