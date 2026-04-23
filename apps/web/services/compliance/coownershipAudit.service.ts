import { prisma } from "@/lib/db";

export type CoOwnershipAuditEvent =
  | "CHECKLIST_UPDATE"
  | "ENFORCEMENT_BLOCK"
  | "OVERRIDE"
  | "VERIFICATION_UPGRADE"
  | "AUTOPILOT_BLOCK";

export async function logCoOwnershipAudit(params: {
  listingId: string;
  actorId?: string;
  event: CoOwnershipAuditEvent;
  reason?: string;
  beforeValue?: any;
  afterValue?: any;
}) {
  return await prisma.coOwnershipAuditLog.create({
    data: {
      listingId: params.listingId,
      actorId: params.actorId,
      event: params.event,
      reason: params.reason,
      beforeValue: params.beforeValue,
      afterValue: params.afterValue,
      timestamp: new Date(),
    },
  });
}

export async function getListingAuditTrail(listingId: string) {
  return await prisma.coOwnershipAuditLog.findMany({
    where: { listingId },
    include: {
      actor: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { timestamp: "desc" },
  });
}
