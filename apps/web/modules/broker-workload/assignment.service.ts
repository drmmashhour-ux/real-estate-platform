import { PlatformRole } from "@prisma/client";
import type { BrokerDealAssignmentRole, BrokerDealAssignmentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { brokerWorkspaceAuditKeys, logBrokerWorkspaceEvent } from "@/lib/broker/broker-workspace-audit";
import { assertDealAccessForBroker } from "@/modules/broker-collaboration/visibility.service";

export async function createDealAssignment(input: {
  actorId: string;
  role: PlatformRole;
  dealId: string;
  assignedToUserId: string;
  roleOnDeal: BrokerDealAssignmentRole;
}) {
  const ok = await assertDealAccessForBroker(input.actorId, input.dealId, input.role);
  if (!ok) return { error: "Deal access denied" as const };

  const row = await prisma.brokerDealAssignment.create({
    data: {
      dealId: input.dealId,
      assignedToUserId: input.assignedToUserId,
      assignedByUserId: input.actorId,
      roleOnDeal: input.roleOnDeal,
      status: "active",
    },
  });

  await logBrokerWorkspaceEvent({
    actorUserId: input.actorId,
    actionKey: brokerWorkspaceAuditKeys.assignmentCreated,
    dealId: input.dealId,
    payload: {
      assignmentId: row.id,
      assignedToUserId: input.assignedToUserId,
      roleOnDeal: input.roleOnDeal,
    },
  });

  return { assignment: row };
}

export async function updateDealAssignment(input: {
  actorId: string;
  role: PlatformRole;
  assignmentId: string;
  status?: BrokerDealAssignmentStatus;
}) {
  const cur = await prisma.brokerDealAssignment.findUnique({
    where: { id: input.assignmentId },
    include: { deal: { select: { brokerId: true, id: true } } },
  });
  if (!cur) return { error: "Not found" as const };
  const ok = await assertDealAccessForBroker(input.actorId, cur.dealId, input.role);
  if (!ok) return { error: "Forbidden" as const };

  const row = await prisma.brokerDealAssignment.update({
    where: { id: input.assignmentId },
    data: { status: input.status ?? cur.status },
  });

  await logBrokerWorkspaceEvent({
    actorUserId: input.actorId,
    actionKey: brokerWorkspaceAuditKeys.assignmentUpdated,
    dealId: cur.dealId,
    payload: { assignmentId: row.id, status: row.status },
  });

  return { assignment: row };
}

export async function listAssignmentsForActor(actorId: string, role: PlatformRole, dealId?: string) {
  if (dealId) {
    const ok = await assertDealAccessForBroker(actorId, dealId, role);
    if (!ok) return [];
    return prisma.brokerDealAssignment.findMany({
      where: { dealId },
      orderBy: { createdAt: "desc" },
    });
  }
  return prisma.brokerDealAssignment.findMany({
    where: { OR: [{ assignedToUserId: actorId }, { assignedByUserId: actorId }] },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}
