/**
 * Routing V2 decision layer on top of V1 ranking — explainable confidence + gated execution.
 */

import { prisma } from "@/lib/db";
import { appendLeadTimelineEvent } from "@/lib/leads/timeline-helpers";
import { assertBrokerCanReceiveNewLead } from "@/modules/billing/brokerLeadBilling";
import { smartRoutingV2Flags } from "@/config/feature-flags";
import { buildLeadRoutingSummary } from "@/modules/broker/routing/broker-routing.service";
import type { BrokerRoutingCandidate } from "@/modules/broker/routing/broker-routing.types";
import type { LeadRoutingDecision } from "@/modules/broker/routing/broker-routing-v2.types";
import {
  ROUTING_V2_AUTO_ASSIGN_MIN_CONFIDENCE,
  ROUTING_V2_CONFIDENCE_APPROVAL_THRESHOLD,
  routingV2Policy,
} from "@/modules/broker/routing/broker-routing-policy";

function clamp(n: number, lo: number, hi: number): number {
  if (!Number.isFinite(n)) return lo;
  return Math.max(lo, Math.min(hi, n));
}

/**
 * Deterministic confidence 0–100 from V1 top two candidates + fit/performance signals.
 */
export function computeRoutingConfidence(
  top: BrokerRoutingCandidate,
  second: BrokerRoutingCandidate | undefined,
): number {
  let c = top.rankScore * 0.52;
  if (top.fitBand === "strong") c += 20;
  else if (top.fitBand === "good") c += 10;
  else if (top.fitBand === "watch") c += 4;

  const perf = top.breakdown.performanceFitScore;
  if (perf >= 78) c += 14;
  else if (perf >= 62) c += 8;
  else if (perf >= 48) c += 3;

  if (top.breakdown.regionFitScore >= 78 && top.breakdown.intentFitScore >= 72) c += 8;

  if (second) {
    const gap = top.rankScore - second.rankScore;
    if (gap < 6) c -= 18;
    else if (gap < 12) c -= 10;
    else if (gap < 18) c -= 4;
  }

  return Math.round(clamp(c, 0, 100));
}

/**
 * Builds a semi-automatic routing decision from Smart Routing V1 output (top-ranked broker).
 */
export async function buildRoutingDecision(leadId: string): Promise<LeadRoutingDecision | null> {
  const summary = await buildLeadRoutingSummary(leadId);
  if (!summary?.topCandidates?.length) return null;

  const top = summary.topCandidates[0];
  if (!top) return null;

  const second = summary.topCandidates[1];
  const confidenceScore = computeRoutingConfidence(top, second);
  const requiresApproval = confidenceScore < ROUTING_V2_CONFIDENCE_APPROVAL_THRESHOLD;

  const rationale: string[] = [
    `Derived from Smart Routing V1 #1: ${top.brokerName ?? top.brokerId.slice(0, 8)}… (rank score ${top.rankScore}, fit ${top.fitBand}).`,
    `Model confidence ${confidenceScore}/100 — ${requiresApproval ? "below approval threshold; manual review suggested before assignment." : "meets threshold for streamlined approval flows."}`,
  ];
  if (top.fitBand === "strong" && top.breakdown.performanceFitScore >= 70) {
    rationale.push("Strong fit band with elevated performance sub-score — higher trust in this match.");
  }
  if (second) {
    rationale.push(
      `Gap to #2: ${top.rankScore - second.rankScore} rank points (${second.brokerName ?? second.brokerId.slice(0, 8)}…).`,
    );
  }
  for (const n of summary.routingNotes.slice(0, 2)) {
    rationale.push(n);
  }

  return {
    leadId,
    recommendedBrokerId: top.brokerId,
    recommendedBrokerName: top.brokerName,
    confidenceScore,
    requiresApproval,
    rationale,
  };
}

export type ExecuteRoutingDecisionResult = {
  status: "executed" | "skipped";
  detail: string;
};

/**
 * Optional auto-assign — only when auto flag + policy + high confidence + no existing introducer.
 * Does not run unless explicitly invoked (e.g. admin “Apply auto”); never blocks brokers or overrides silently if introducer exists.
 */
export async function executeRoutingDecision(
  decision: LeadRoutingDecision,
): Promise<ExecuteRoutingDecisionResult> {
  if (!smartRoutingV2Flags.smartRoutingAutoAssign) {
    return { status: "skipped", detail: "FEATURE_SMART_ROUTING_AUTO_ASSIGN is off — suggestion only." };
  }
  if (!routingV2Policy.allowAutoAssign) {
    return {
      status: "skipped",
      detail: "Policy SMART_ROUTING_AUTO_ASSIGN_POLICY disables automatic assignment.",
    };
  }
  if (decision.requiresApproval) {
    return {
      status: "skipped",
      detail: "Decision is marked requiresApproval — use admin approve or adjust policy/thresholds.",
    };
  }
  if (decision.confidenceScore < ROUTING_V2_AUTO_ASSIGN_MIN_CONFIDENCE) {
    return {
      status: "skipped",
      detail: `Confidence ${decision.confidenceScore} is below auto-assign minimum (${ROUTING_V2_AUTO_ASSIGN_MIN_CONFIDENCE}).`,
    };
  }

  const lead = await prisma.lead.findUnique({
    where: { id: decision.leadId },
    select: { introducedByBrokerId: true },
  });
  if (!lead) {
    return { status: "skipped", detail: "Lead not found." };
  }
  if (lead.introducedByBrokerId) {
    return {
      status: "skipped",
      detail: "Lead already has an introducing broker — no automatic override (reversible only via explicit admin action).",
    };
  }

  const gate = await assertBrokerCanReceiveNewLead(prisma, decision.recommendedBrokerId);
  if (!gate.ok) {
    return {
      status: "skipped",
      detail: `Broker cannot receive this lead under billing rules (${gate.reason}).`,
    };
  }

  await prisma.lead.update({
    where: { id: decision.leadId },
    data: { introducedByBrokerId: decision.recommendedBrokerId },
  });
  await appendLeadTimelineEvent(decision.leadId, "smart_routing_v2_auto_assign", {
    brokerId: decision.recommendedBrokerId,
    confidence: decision.confidenceScore,
    source: "routing_v2_execute",
  });

  return {
    status: "executed",
    detail: "Introducing broker set from routing V2 auto path (gates passed).",
  };
}

/**
 * Admin-approved assignment — does not require auto-assign flag; still respects broker receive gate.
 */
export async function applyRoutingDecisionManually(
  leadId: string,
  brokerId: string,
  meta: { source: "routing_v2_panel_approve" | "routing_v2_panel_override" },
): Promise<{ ok: true } | { ok: false; detail: string }> {
  const gate = await assertBrokerCanReceiveNewLead(prisma, brokerId);
  if (!gate.ok) {
    return { ok: false, detail: `Broker cannot receive this lead (${gate.reason}).` };
  }
  await prisma.lead.update({
    where: { id: leadId },
    data: { introducedByBrokerId: brokerId },
  });
  await appendLeadTimelineEvent(leadId, "smart_routing_v2_manual_assign", {
    brokerId,
    source: meta.source,
  });
  return { ok: true };
}
