/**
 * Governance layer for marketplace-adjacent optimization proposals — wraps `AutonomyDecision`
 * without replacing the autonomy engine.
 */
import type { AutonomyDecision } from "@prisma/client";

import { prisma } from "@/lib/db";
import {
  applyDecision,
  approveDecision,
  markDecisionExpired,
  rejectDecision,
} from "@/modules/autonomy/autonomy-decision.service";
import type { AutonomyDomain } from "@/modules/autonomy/autonomy-types";
import { AUTONOMY_DOMAINS } from "@/modules/autonomy/autonomy-types";
import { logAutonomousBrainAudit } from "@/modules/autonomous-brain/autonomous-brain-audit.service";

/** Operator-facing statuses (maps from underlying autonomy rows). */
export type MarketplaceOptimizationUiStatus =
  | "PROPOSED"
  | "APPROVED"
  | "REJECTED"
  | "IMPLEMENTED"
  | "EXPIRED";

export type MarketplaceOptimizationProposalRow = Pick<
  AutonomyDecision,
  | "id"
  | "domain"
  | "action"
  | "rationale"
  | "confidence"
  | "impactEstimate"
  | "requiresApproval"
  | "status"
  | "payloadJson"
  | "baselineMetricsJson"
  | "createdAt"
  | "approvedAt"
  | "appliedAt"
  | "approvedByUserId"
> & {
  uiStatus: MarketplaceOptimizationUiStatus;
};

/** Maps autonomy row `status` to operator-facing marketplace workflow labels (for UI + tests). */
export function mapAutonomyStatusToMarketplaceUi(raw: string): MarketplaceOptimizationUiStatus {
  if (raw === "AUTO_APPLIED" || raw === "APPLIED") return "IMPLEMENTED";
  if (raw === "EXPIRED") return "EXPIRED";
  if (
    raw === "PROPOSED" ||
    raw === "APPROVED" ||
    raw === "REJECTED"
  ) {
    return raw;
  }
  /** Rolled back / invalid proposals are surfaced as rejected for operator clarity. */
  return "REJECTED";
}

function domainFilter(): { domain: { in: readonly AutonomyDomain[] } } {
  return { domain: { in: [...AUTONOMY_DOMAINS] } };
}

export type ListOptimizationProposalsQuery = {
  uiStatuses?: MarketplaceOptimizationUiStatus[];
  take?: number;
};

export async function listMarketplaceOptimizationProposals(
  q: ListOptimizationProposalsQuery = {}
): Promise<MarketplaceOptimizationProposalRow[]> {
  const take = Math.min(Math.max(q.take ?? 120, 1), 400);

  const rows = await prisma.autonomyDecision.findMany({
    where: domainFilter(),
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      domain: true,
      action: true,
      rationale: true,
      confidence: true,
      impactEstimate: true,
      requiresApproval: true,
      status: true,
      payloadJson: true,
      baselineMetricsJson: true,
      createdAt: true,
      approvedAt: true,
      appliedAt: true,
      approvedByUserId: true,
    },
  });

  const mapped = rows.map((r) => ({
    ...r,
    uiStatus: mapAutonomyStatusToMarketplaceUi(r.status),
  }));

  const filterSet = q.uiStatuses?.length ? new Set(q.uiStatuses) : null;
  if (!filterSet) return mapped;

  return mapped.filter((r) => filterSet.has(r.uiStatus));
}

export async function approveOptimizationProposal(params: {
  decisionId: string;
  actorUserId: string;
  note?: string | null;
}): Promise<void> {
  await approveDecision(params.decisionId, params.actorUserId, params.note);
  await logAutonomousBrainAudit({
    actorUserId: params.actorUserId,
    action: "APPROVE",
    entityType: "optimization_proposal",
    entityId: params.decisionId,
    note: params.note,
  });
}

export async function rejectOptimizationProposal(params: {
  decisionId: string;
  actorUserId: string;
  note?: string | null;
}): Promise<void> {
  await rejectDecision(params.decisionId, params.actorUserId, params.note);
  await logAutonomousBrainAudit({
    actorUserId: params.actorUserId,
    action: "REJECT",
    entityType: "optimization_proposal",
    entityId: params.decisionId,
    note: params.note,
  });
}

export async function implementOptimizationProposal(params: {
  decisionId: string;
  actorUserId: string;
  note?: string | null;
}): Promise<void> {
  await applyDecision(params.decisionId);
  await logAutonomousBrainAudit({
    actorUserId: params.actorUserId,
    action: "IMPLEMENT",
    entityType: "optimization_proposal",
    entityId: params.decisionId,
    note: params.note,
    detail: { appliedVia: "applyDecision" },
  });
}

export async function expireOptimizationProposal(params: {
  decisionId: string;
  actorUserId: string;
  note?: string | null;
}): Promise<void> {
  await markDecisionExpired(params.decisionId, params.actorUserId, params.note);
  await logAutonomousBrainAudit({
    actorUserId: params.actorUserId,
    action: "EXPIRE",
    entityType: "optimization_proposal",
    entityId: params.decisionId,
    note: params.note,
  });
}
