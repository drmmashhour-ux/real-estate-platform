/**
 * Pipeline + assignment velocity — gentle penalties only (no hard exclude).
 */

import type { BrokerCapacitySnapshot } from "./broker-availability.types";
import { recordBrokerCapacitySnapshotBuilt } from "./broker-availability-monitoring.service";

function clamp(n: number, lo: number, hi: number): number {
  if (!Number.isFinite(n)) return lo;
  return Math.max(lo, Math.min(hi, n));
}

export type BuildBrokerCapacityInput = {
  brokerId: string;
  activeLeads: number;
  overdueFollowUps: number;
  recentAssignments: number;
  maxActiveLeadsHint?: number | null;
  preferredRange?: { min?: number; max?: number } | null;
  /** When true, prefer neutral score over invented precision. */
  sparseFallback?: boolean;
};

export function buildBrokerCapacitySnapshot(input: BuildBrokerCapacityInput): BrokerCapacitySnapshot {
  try {
    recordBrokerCapacitySnapshotBuilt({
      sparse: Boolean(input.sparseFallback || input.activeLeads === 0 && input.maxActiveLeadsHint == null),
    });
  } catch {
    /* noop */
  }

  if (input.sparseFallback) {
    return {
      brokerId: input.brokerId,
      activeLeads: input.activeLeads,
      overdueFollowUps: input.overdueFollowUps,
      recentAssignments: input.recentAssignments,
      maxActiveLeadsHint: input.maxActiveLeadsHint,
      capacityScore: 52,
      status: "available",
      explanation: "Sparse routing context — capacity score kept neutral.",
    };
  }

  let score = 72;
  const hints: string[] = [];

  const maxH = input.maxActiveLeadsHint;
  if (maxH != null && maxH > 0) {
    const ratio = input.activeLeads / maxH;
    if (ratio <= 0.35) {
      score += 10;
      hints.push("Active pipeline comfortably under declared ceiling.");
    } else if (ratio <= 0.62) {
      score += 3;
      hints.push("Active pipeline within a normal band vs declared ceiling.");
    } else if (ratio <= 0.92) {
      score -= 6;
      hints.push("Approaching declared active ceiling — mild routing caution.");
    } else {
      score -= 14;
      hints.push("Near/over declared ceiling — routed as limited capacity.");
    }
  } else if (input.preferredRange?.max != null && input.activeLeads > input.preferredRange.max + 6) {
    score -= 8;
    hints.push("Active count above preferred range upper hint.");
  }

  const overduePen = clamp(input.overdueFollowUps * 5, 0, 22);
  score -= overduePen;
  if (overduePen >= 8) hints.push("Multiple overdue follow-up proxies — soften routing preference.");

  const velocityPen = clamp(input.recentAssignments * 3, 0, 14);
  score -= velocityPen;
  if (velocityPen >= 6) hints.push("Recent internal assignment velocity — fairness spread.");

  const activeSoft = clamp(Math.round(input.activeLeads / 7), 0, 12);
  score -= activeSoft;

  score = clamp(Math.round(score), 18, 94);

  let status: BrokerCapacitySnapshot["status"] = "available";
  if (score < 38 || overduePen >= 18) status = "unavailable";
  else if (score < 56 || overduePen >= 10 || (maxH != null && input.activeLeads / maxH > 0.85))
    status = "limited";

  const explanation =
    hints.length > 0
      ? hints.join(" ")
      : "Pipeline signals look balanced vs peers in this routing snapshot.";

  return {
    brokerId: input.brokerId,
    activeLeads: input.activeLeads,
    overdueFollowUps: input.overdueFollowUps,
    recentAssignments: input.recentAssignments,
    maxActiveLeadsHint: input.maxActiveLeadsHint,
    capacityScore: score,
    status,
    explanation,
  };
}
