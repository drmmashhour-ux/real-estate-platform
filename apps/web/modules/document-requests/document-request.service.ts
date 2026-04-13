import { DealRequestStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logCoordinationAudit } from "@/lib/deals/coordination-audit";
import type { CreateDealRequestInput, PatchDealRequestInput } from "./document-requests.types";
import { applyRequestStatusSideEffects } from "./request-state-machine.service";
import { recomputeRequestFulfillment } from "./request-fulfilment.service";

export async function listDealRequests(dealId: string) {
  return prisma.dealRequest.findMany({
    where: { dealId },
    include: { items: true, communications: { orderBy: { createdAt: "desc" }, take: 5 } },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getDealRequest(dealId: string, requestId: string) {
  return prisma.dealRequest.findFirst({
    where: { id: requestId, dealId },
    include: { items: true, communications: { orderBy: { createdAt: "desc" } } },
  });
}

export async function createDealRequest(dealId: string, input: CreateDealRequestInput, actorUserId: string) {
  const row = await prisma.dealRequest.create({
    data: {
      dealId,
      requestType: input.requestType,
      requestCategory: input.requestCategory,
      title: input.title,
      summary: input.summary ?? undefined,
      targetRole: input.targetRole,
      targetEntityType: input.targetEntityType ?? undefined,
      targetEntityId: input.targetEntityId ?? undefined,
      dueAt: input.dueAt ?? undefined,
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
      status: DealRequestStatus.DRAFT,
      items: input.items?.length
        ? {
            create: input.items.map((i) => ({
              itemKey: i.itemKey,
              itemLabel: i.itemLabel,
              isRequired: i.isRequired ?? true,
            })),
          }
        : undefined,
    },
    include: { items: true },
  });
  await logCoordinationAudit({
    dealId,
    action: "request_created",
    actorUserId,
    entityType: "DealRequest",
    entityId: row.id,
    payload: { category: input.requestCategory, requestType: input.requestType },
  });
  return row;
}

export async function patchDealRequest(
  dealId: string,
  requestId: string,
  input: PatchDealRequestInput,
  actorUserId: string
) {
  const existing = await prisma.dealRequest.findFirst({ where: { id: requestId, dealId } });
  if (!existing) return null;

  const data: Prisma.DealRequestUpdateInput = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.summary !== undefined) data.summary = input.summary;
  if (input.dueAt !== undefined) data.dueAt = input.dueAt;
  if (input.blockedReason !== undefined) data.blockedReason = input.blockedReason;
  if (input.metadata !== undefined) data.metadata = input.metadata as Prisma.InputJsonValue;
  if (input.brokerApprovedAt !== undefined) data.brokerApprovedAt = input.brokerApprovedAt;
  if (input.status !== undefined) {
    const next = applyRequestStatusSideEffects(existing.status, input.status, existing);
    data.status = next;
    if (next === DealRequestStatus.FULFILLED) {
      data.fulfilledAt = new Date();
    }
  }

  const updated = await prisma.dealRequest.update({
    where: { id: requestId },
    data,
    include: { items: true },
  });
  await recomputeRequestFulfillment(updated.id);
  await logCoordinationAudit({
    dealId,
    action: "request_updated",
    actorUserId,
    entityType: "DealRequest",
    entityId: requestId,
    payload: { status: updated.status },
  });
  return prisma.dealRequest.findFirst({
    where: { id: requestId },
    include: { items: true, communications: { orderBy: { createdAt: "desc" } } },
  });
}
