/**
 * Deterministic prioritization for Deal Conversion Console — same ordering as `computeTopThreeToClose`,
 * plus explicit scores and highlight helpers (no ML).
 */

import type { BrokerNextBestAction } from "./broker-next-action.service";
import {
  computeIdleHours,
  computeTopThreeToClose,
  type TopThreeToCloseRow,
} from "./broker-next-action.service";
import type { LeadClosingStage, LeadClosingState } from "./broker-closing.types";

const URGENCY_RANK: Record<"low" | "medium" | "high", number> = { high: 0, medium: 1, low: 2 };

function terminal(stage: LeadClosingStage): boolean {
  return stage === "closed_won" || stage === "closed_lost";
}

export type ConversionLeadMomentum = "needs_action_now" | "hot_lead" | "cooling_down" | "steady";

export type RankedLeadForConsole = {
  leadId: string;
  name: string;
  score: number;
  closing: LeadClosingState;
  nextAction: BrokerNextBestAction;
  /** Higher = higher priority — derived deterministically */
  conversionScore: number;
  momentum: ConversionLeadMomentum;
  /** Idle ≥72h on non-terminal — “stuck” highlight */
  isStuck: boolean;
};

/** Lexicographic sort matches `computeTopThreeToClose`: urgency → score desc → leadId asc. */
export function rankLeadsForConversionConsole(
  rows: Array<{
    leadId: string;
    name: string;
    score: number;
    closing: LeadClosingState;
    nextAction: BrokerNextBestAction;
  }>,
  nowMs: number,
): RankedLeadForConsole[] {
  const open = rows.filter((r) => !terminal(r.closing.stage));
  const sorted = [...open].sort((a, b) => {
    const ua = URGENCY_RANK[a.nextAction.urgency];
    const ub = URGENCY_RANK[b.nextAction.urgency];
    if (ua !== ub) return ua - ub;
    if (b.score !== a.score) return b.score - a.score;
    return a.leadId.localeCompare(b.leadId);
  });

  return sorted.map((r, index) => {
    const idleH = computeIdleHours(r.closing, nowMs);
    const momentum = deriveMomentum(r.closing, r.nextAction, idleH, r.score);
    const isStuck = Boolean(idleH != null && idleH >= 72 && !terminal(r.closing.stage));
    const conversionScore = computeConversionScore(r.nextAction, r.score, index);
    return {
      leadId: r.leadId,
      name: r.name,
      score: r.score,
      closing: r.closing,
      nextAction: r.nextAction,
      conversionScore,
      momentum,
      isStuck,
    };
  });
}

/** Monotonic display score — lower index in sorted list = higher score. */
function computeConversionScore(nextAction: BrokerNextBestAction, leadScore: number, sortIndex: number): number {
  const ur = 3 - URGENCY_RANK[nextAction.urgency];
  return ur * 1_000_000 + Math.min(999, Math.max(0, leadScore)) * 1_000 + (10_000 - Math.min(sortIndex, 9999));
}

export function deriveMomentum(
  closing: LeadClosingState,
  nextAction: BrokerNextBestAction,
  idleHours: number | null,
  leadScore: number,
): ConversionLeadMomentum {
  if (terminal(closing.stage)) return "steady";

  if (nextAction.urgency === "high" || closing.stage === "new") return "needs_action_now";

  if (idleHours != null && idleHours >= 96) return "cooling_down";

  if (
    leadScore >= 70 &&
    (closing.stage === "responded" || closing.stage === "meeting_scheduled" || closing.stage === "negotiation")
  ) {
    return "hot_lead";
  }

  return "steady";
}

export type LeadHighlightSets = {
  topThreeIds: Set<string>;
  urgentIds: Set<string>;
  stuckIds: Set<string>;
};

export function buildLeadHighlightSets(
  ranked: RankedLeadForConsole[],
  topThree: TopThreeToCloseRow[],
  nowMs: number,
): LeadHighlightSets {
  const topThreeIds = new Set(topThree.map((t) => t.leadId));
  const urgentIds = new Set(ranked.filter((r) => r.nextAction.urgency === "high").map((r) => r.leadId));
  const stuckIds = new Set(
    ranked
      .filter((r) => {
        const idle = computeIdleHours(r.closing, nowMs);
        return idle != null && idle >= 72 && !terminal(r.closing.stage);
      })
      .map((r) => r.leadId),
  );
  return { topThreeIds, urgentIds, stuckIds };
}

/** Re-export wrapper — single source for “top 3” rows used in strip + console. */
export function pickTopThreeToClose(
  rows: Parameters<typeof computeTopThreeToClose>[0],
): TopThreeToCloseRow[] {
  return computeTopThreeToClose(rows);
}
