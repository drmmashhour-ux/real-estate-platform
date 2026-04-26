/**
 * Approval queue — admin/staff only via route guards; Prisma-backed; never throws.
 */

import type { Prisma } from "@/generated/prisma";
import type { MarketplaceActionProposal } from "./darlink-marketplace-autonomy.types";
import type { MarketplacePolicyEvaluation } from "./darlink-marketplace-autonomy.types";
import { prisma } from "@/lib/db";
import { persistAutonomyAuditEvent } from "./darlink-autonomy-persistence.service";
import { DarlinkAutonomyAuditEvent } from "./darlink-autonomy-audit.types";

export function buildProposalStableKey(proposal: MarketplaceActionProposal): string {
  try {
    return `${proposal.actionType}|${proposal.entityType}|${proposal.entityId ?? "none"}|${proposal.opportunityId}|${proposal.id}`;
  } catch {
    return `fallback|${proposal.id}`;
  }
}

export type ApprovalRequestParams = {
  proposal: MarketplaceActionProposal;
  policySnapshot: MarketplacePolicyEvaluation;
  requestedByUserId: string | null;
};

export async function requestMarketplaceApproval(params: ApprovalRequestParams): Promise<{ id: string | null; duplicate: boolean }> {
  try {
    const proposalKey = buildProposalStableKey(params.proposal);
    const existing = await prisma.syriaMarketplaceAutonomyApproval.findUnique({
      where: { proposalKey },
    });
    if (existing) {
      return { id: existing.id, duplicate: existing.status === "PENDING" };
    }
    const row = await prisma.syriaMarketplaceAutonomyApproval.create({
      data: {
        proposalKey,
        actionType: params.proposal.actionType,
        targetEntityType: params.proposal.entityType,
        targetEntityId: params.proposal.entityId ?? undefined,
        payloadJson: params.proposal.payload as object,
        policySnapshot: params.policySnapshot as unknown as Prisma.InputJsonValue,
        status: "PENDING",
        requestedByUserId: params.requestedByUserId ?? undefined,
      },
    });
    await persistAutonomyAuditEvent({
      eventType: DarlinkAutonomyAuditEvent.ACTION_PENDING_APPROVAL,
      payload: { approvalId: row.id, proposalKey },
      actorUserId: params.requestedByUserId,
    });
    return { id: row.id, duplicate: false };
  } catch {
    return { id: null, duplicate: false };
  }
}

export async function approveMarketplaceAction(params: {
  approvalId: string;
  decidedByUserId: string;
  notes?: string | null;
}): Promise<{ ok: boolean; reason?: string }> {
  try {
    const row = await prisma.syriaMarketplaceAutonomyApproval.findUnique({ where: { id: params.approvalId } });
    if (!row || row.status !== "PENDING") {
      return { ok: false, reason: "invalid_or_not_pending" };
    }
    await prisma.syriaMarketplaceAutonomyApproval.update({
      where: { id: params.approvalId },
      data: {
        status: "APPROVED",
        decidedByUserId: params.decidedByUserId,
        decidedAt: new Date(),
        notes: params.notes ?? undefined,
      },
    });
    return { ok: true };
  } catch {
    return { ok: false, reason: "persist_failed" };
  }
}

export async function rejectMarketplaceAction(params: {
  approvalId: string;
  decidedByUserId: string;
  notes?: string | null;
}): Promise<{ ok: boolean }> {
  try {
    await prisma.syriaMarketplaceAutonomyApproval.update({
      where: { id: params.approvalId },
      data: {
        status: "REJECTED",
        decidedByUserId: params.decidedByUserId,
        decidedAt: new Date(),
        notes: params.notes ?? undefined,
      },
    });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function listMarketplacePendingApprovals(): Promise<
  {
    id: string;
    actionType: string;
    targetEntityType: string;
    targetEntityId: string | null;
    createdAt: Date;
  }[]
> {
  try {
    const rows = await prisma.syriaMarketplaceAutonomyApproval.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      take: 200,
      select: {
        id: true,
        actionType: true,
        targetEntityType: true,
        targetEntityId: true,
        createdAt: true,
      },
    });
    return rows;
  } catch {
    return [];
  }
}

export async function getApprovalById(id: string) {
  try {
    return await prisma.syriaMarketplaceAutonomyApproval.findUnique({ where: { id } });
  } catch {
    return null;
  }
}
