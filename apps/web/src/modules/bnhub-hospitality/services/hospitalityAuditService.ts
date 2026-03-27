import type { BnhubHospitalityAuditActorType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function logHospitalityAction(args: {
  actorType: BnhubHospitalityAuditActorType;
  actorId?: string | null;
  entityType: string;
  entityId: string;
  actionType: string;
  actionSummary: string;
  before?: Prisma.InputJsonValue | null;
  after?: Prisma.InputJsonValue | null;
}): Promise<void> {
  await prisma.bnhubHospitalityAuditLog.create({
    data: {
      actorType: args.actorType,
      actorId: args.actorId ?? null,
      entityType: args.entityType,
      entityId: args.entityId,
      actionType: args.actionType,
      actionSummary: args.actionSummary,
      beforeJson: args.before ?? undefined,
      afterJson: args.after ?? undefined,
    },
  });
}

export const logServiceAction = logHospitalityAction;
export const logBundleAction = logHospitalityAction;
export const logMembershipAction = logHospitalityAction;
export const logConciergeAction = logHospitalityAction;
export const logModerationAction = logHospitalityAction;
