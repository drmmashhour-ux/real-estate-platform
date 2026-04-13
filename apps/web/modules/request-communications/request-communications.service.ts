import { RequestCommunicationChannel, RequestCommunicationDirection } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logCoordinationAudit } from "@/lib/deals/coordination-audit";
import type { CommunicationDraftInput } from "./request-communications.types";
import { buildEmailDraftForRequest } from "./request-template-builder.service";

export async function listCommunicationsForDeal(dealId: string) {
  return prisma.requestCommunication.findMany({
    where: { dealRequest: { dealId } },
    orderBy: { createdAt: "desc" },
    include: { dealRequest: { select: { id: true, title: true } } },
  });
}

export async function createCommunicationDraft(
  dealId: string,
  input: CommunicationDraftInput,
  actorUserId: string
) {
  const req = await prisma.dealRequest.findFirst({
    where: { id: input.dealRequestId, dealId },
  });
  if (!req) return null;

  const row = await prisma.requestCommunication.create({
    data: {
      dealRequestId: input.dealRequestId,
      channel: input.channel,
      direction: input.direction,
      subject: input.subject ?? undefined,
      body: input.body ?? undefined,
      createdByUserId: actorUserId,
      metadata: (input.metadata ?? {}) as object,
    },
  });
  await logCoordinationAudit({
    dealId,
    action: "communication_draft_created",
    actorUserId,
    entityType: "RequestCommunication",
    entityId: row.id,
    payload: { channel: input.channel },
  });
  return row;
}

export async function createAutoDraftFromRequest(dealId: string, requestId: string, actorUserId: string) {
  const req = await prisma.dealRequest.findFirst({ where: { id: requestId, dealId } });
  if (!req) return null;
  const built = buildEmailDraftForRequest(req);
  return createCommunicationDraft(
    dealId,
    {
      dealRequestId: requestId,
      channel: RequestCommunicationChannel.EMAIL_DRAFT,
      direction: RequestCommunicationDirection.OUTBOUND,
      subject: built.subject,
      body: built.body,
    },
    actorUserId
  );
}
