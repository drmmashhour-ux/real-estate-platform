import type { AutonomousAction } from "@/lib/autonomy/types";
import { prisma } from "@/lib/db";
import { payloadForAutonomousAction } from "./queue";
import type { ApprovalStatus, CreateAutonomyApprovalInput } from "./types";

export async function createPendingApprovalForAction(
  action: AutonomousAction,
  opts?: { summary?: string | null; requestedByUserId?: string | null },
) {
  return createPendingApproval({
    actionType: action.type.slice(0, 64),
    riskTier: action.risk,
    payload: payloadForAutonomousAction(action),
    summary: opts?.summary ?? null,
    requestedByUserId: opts?.requestedByUserId ?? null,
  });
}

export async function createPendingApproval(input: CreateAutonomyApprovalInput) {
  return prisma.marketplaceAutonomyApproval.create({
    data: {
      status: "pending",
      actionType: input.actionType.slice(0, 64),
      riskTier: input.riskTier.slice(0, 16),
      payload: (input.payload ?? {}) as object,
      summary: input.summary?.slice(0, 512) ?? null,
      requestedByUserId: input.requestedByUserId ?? null,
    },
  });
}

export async function listApprovalsByStatus(status: ApprovalStatus, take = 50) {
  return prisma.marketplaceAutonomyApproval.findMany({
    where: { status },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function approveApproval(id: string, reviewerUserId: string, note?: string | null) {
  return prisma.marketplaceAutonomyApproval.update({
    where: { id },
    data: {
      status: "approved",
      reviewedByUserId: reviewerUserId,
      reviewNote: note ?? null,
    },
  });
}

export async function rejectApproval(id: string, reviewerUserId: string, note?: string | null) {
  return prisma.marketplaceAutonomyApproval.update({
    where: { id },
    data: {
      status: "rejected",
      reviewedByUserId: reviewerUserId,
      reviewNote: note ?? null,
    },
  });
}

export async function markApprovalExecuted(id: string) {
  return prisma.marketplaceAutonomyApproval.update({
    where: { id },
    data: {
      status: "executed",
      executedAt: new Date(),
    },
  });
}
