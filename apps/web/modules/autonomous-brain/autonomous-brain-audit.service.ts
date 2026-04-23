/**
 * Unified operator audit trail for Autonomous Brain actions (cross-domain).
 * Uses existing `ManagerAiOverrideEvent` — additive, no new tables.
 */
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";

export type AutonomousBrainAuditEntity =
  | "optimization_proposal"
  | "learning_pattern"
  | "investment_opportunity"
  | "priority_review";

export type AutonomousBrainAuditAction =
  | "APPROVE"
  | "REJECT"
  | "IMPLEMENT"
  | "EXPIRE"
  | "VIEW"
  | "NOTE";

const SCOPE = "autonomous_brain_control_center";

export async function logAutonomousBrainAudit(params: {
  actorUserId: string;
  action: AutonomousBrainAuditAction;
  entityType: AutonomousBrainAuditEntity;
  entityId: string;
  note?: string | null;
  detail?: Record<string, unknown>;
}): Promise<void> {
  const targetJson: Prisma.InputJsonValue = {
    entityType: params.entityType,
    entityId: params.entityId,
    action: params.action,
    ...(params.detail ? { detail: params.detail } : {}),
  };

  await prisma.managerAiOverrideEvent.create({
    data: {
      actorUserId: params.actorUserId,
      scope: SCOPE,
      targetJson,
      note: params.note?.trim() || undefined,
    },
  });
}

export async function listRecentAutonomousBrainAudit(take = 50) {
  return prisma.managerAiOverrideEvent.findMany({
    where: { scope: SCOPE },
    orderBy: { createdAt: "desc" },
    take: Math.min(take, 200),
    select: {
      id: true,
      actorUserId: true,
      note: true,
      targetJson: true,
      createdAt: true,
    },
  });
}
