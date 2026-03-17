/**
 * Internal Access Defense – privileged action logging, approval requests.
 * Least-privilege, step-up, reason codes, dual-control for critical actions.
 */
import { prisma } from "@/lib/db";
import type { ApprovalRequestStatus } from "@prisma/client";

export type { ApprovalRequestStatus };

/** Log a privileged admin action (payout release, suspension, ban, evidence access, etc.). */
export async function logPrivilegedAction(params: {
  adminId: string;
  actionType: string;
  entityType?: string;
  entityId?: string;
  reasonCode?: string;
  reasonText?: string;
  approvalId?: string;
  metadata?: object;
}) {
  return prisma.privilegedAdminAction.create({
    data: {
      adminId: params.adminId,
      actionType: params.actionType,
      entityType: params.entityType,
      entityId: params.entityId,
      reasonCode: params.reasonCode,
      reasonText: params.reasonText,
      approvalId: params.approvalId,
      metadata: (params.metadata as object) ?? undefined,
    },
  });
}

/** Create an approval request (for dual-control / step-up). */
export async function createApprovalRequest(params: {
  requestType: string;
  requestedBy: string;
  targetType?: string;
  targetId?: string;
  reasonCode?: string;
  payload?: object;
}) {
  return prisma.approvalRequest.create({
    data: {
      requestType: params.requestType,
      requestedBy: params.requestedBy,
      targetType: params.targetType,
      targetId: params.targetId,
      reasonCode: params.reasonCode,
      payload: (params.payload as object) ?? undefined,
      status: "PENDING",
    },
  });
}

/** Approve or reject an approval request. */
export async function reviewApprovalRequest(
  id: string,
  decision: "APPROVED" | "REJECTED",
  reviewedBy: string,
  reviewNotes?: string
) {
  return prisma.approvalRequest.update({
    where: { id },
    data: {
      status: decision,
      reviewedBy,
      reviewedAt: new Date(),
      reviewNotes,
    },
  });
}

/** Get pending approval requests. */
export async function getPendingApprovals(limit = 50) {
  return prisma.approvalRequest.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/** Get privileged actions for audit. */
export async function getPrivilegedActions(params: {
  adminId?: string;
  actionType?: string;
  from?: Date;
  limit?: number;
}) {
  const where: Record<string, unknown> = {};
  if (params.adminId) where.adminId = params.adminId;
  if (params.actionType) where.actionType = params.actionType;
  if (params.from) where.createdAt = { gte: params.from };
  return prisma.privilegedAdminAction.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: params.limit ?? 100,
  });
}
