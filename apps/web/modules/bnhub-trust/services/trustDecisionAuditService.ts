import type { Prisma } from "@prisma/client";
import { BnhubTrustIdentityAuditActor } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function logTrustAudit(params: {
  actorType: BnhubTrustIdentityAuditActor;
  actorId?: string | null;
  entityType: string;
  entityId: string;
  actionType: string;
  actionSummary: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}) {
  await prisma.bnhubIdentityAuditLog.create({
    data: {
      actorType: params.actorType,
      actorId: params.actorId ?? undefined,
      entityType: params.entityType,
      entityId: params.entityId,
      actionType: params.actionType,
      actionSummary: params.actionSummary,
      beforeJson: params.before as Prisma.InputJsonValue | undefined,
      afterJson: params.after as Prisma.InputJsonValue | undefined,
    },
  });
}

type TrustAuditBase = Parameters<typeof logTrustAudit>[0];

export const logIdentityAction = (
  p: Omit<TrustAuditBase, "entityType" | "entityId"> & { userId: string },
) => logTrustAudit({ ...p, entityType: "identity", entityId: p.userId });

export const logAddressAction = (
  p: Omit<TrustAuditBase, "entityType" | "entityId"> & { listingId: string },
) => logTrustAudit({ ...p, entityType: "address_verification", entityId: p.listingId });

export const logMediaAction = (
  p: Omit<TrustAuditBase, "entityType" | "entityId"> & { listingId: string },
) => logTrustAudit({ ...p, entityType: "media_validation", entityId: p.listingId });

export const logRiskAction = (
  p: Omit<TrustAuditBase, "entityType" | "entityId"> & { listingId: string },
) => logTrustAudit({ ...p, entityType: "listing_risk", entityId: p.listingId });

export const logPolicyAction = (
  p: Omit<TrustAuditBase, "entityType" | "entityId"> & { listingId: string },
) => logTrustAudit({ ...p, entityType: "location_policy", entityId: p.listingId });
