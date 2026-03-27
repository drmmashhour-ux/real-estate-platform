/**
 * Trust & Safety appeals: submit, list, resolve.
 */

import { prisma } from "@/lib/db";
import type { TrustSafetyAppealStatus } from "@prisma/client";
import { notifyTrustSafety } from "./notifications";

export interface SubmitAppealInput {
  incidentId: string;
  actionId?: string | null;
  submittedBy: string;
  appealReason: string;
}

export async function submitAppeal(input: SubmitAppealInput): Promise<{ appealId: string }> {
  const incident = await prisma.trustSafetyIncident.findUniqueOrThrow({
    where: { id: input.incidentId },
    select: { id: true, reporterId: true, accusedUserId: true },
  });

  const appeal = await prisma.trustSafetyAppeal.create({
    data: {
      incidentId: input.incidentId,
      actionId: input.actionId ?? undefined,
      submittedBy: input.submittedBy,
      appealReason: input.appealReason,
      status: "PENDING",
    },
  });

  void notifyTrustSafety({
    event: "complaint_submitted",
    disputeId: input.incidentId,
    userId: input.submittedBy,
    message: "Appeal submitted",
    metadata: { appealId: appeal.id },
  });

  return { appealId: appeal.id };
}

export async function getAppeal(appealId: string) {
  return prisma.trustSafetyAppeal.findUniqueOrThrow({
    where: { id: appealId },
    include: {
      incident: {
        select: {
          id: true,
          incidentCategory: true,
          status: true,
          severityLevel: true,
          description: true,
        },
      },
      submitter: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function resolveAppeal(params: {
  appealId: string;
  status: TrustSafetyAppealStatus;
  reviewedBy: string;
  resolutionNote?: string | null;
}): Promise<void> {
  await prisma.trustSafetyAppeal.update({
    where: { id: params.appealId },
    data: {
      status: params.status,
      reviewedBy: params.reviewedBy,
      resolvedAt: new Date(),
      resolutionNote: params.resolutionNote ?? undefined,
      updatedAt: new Date(),
    },
  });
}

export async function listAppeals(filters: { status?: string; incidentId?: string; limit?: number }) {
  const where: Record<string, unknown> = {};
  if (filters.status) where.status = filters.status;
  if (filters.incidentId) where.incidentId = filters.incidentId;

  return prisma.trustSafetyAppeal.findMany({
    where,
    take: Math.min(filters.limit ?? 50, 100),
    orderBy: { createdAt: "desc" },
    include: {
      incident: { select: { id: true, incidentCategory: true, status: true } },
      submitter: { select: { id: true, name: true, email: true } },
    },
  });
}
