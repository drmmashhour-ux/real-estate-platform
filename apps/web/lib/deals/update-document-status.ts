import type { DealDocumentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { DEAL_ROOM_EVENT } from "./constants";
import { addDealRoomEvent } from "./add-event";

export async function updateDealRoomDocumentStatus(input: {
  dealRoomId: string;
  documentId: string;
  status: DealDocumentStatus;
  actorUserId?: string | null;
}) {
  const prev = await prisma.dealRoomDocument.findFirst({
    where: { id: input.documentId, dealRoomId: input.dealRoomId },
  });
  if (!prev) {
    throw new Error("Document not found");
  }
  const doc = await prisma.dealRoomDocument.update({
    where: { id: input.documentId },
    data: { status: input.status },
  });
  await addDealRoomEvent({
    dealRoomId: input.dealRoomId,
    eventType: DEAL_ROOM_EVENT.DOCUMENT_STATUS_UPDATED,
    title: `Document status: ${doc.title}`,
    body: `${prev.status} → ${input.status}`,
    metadataJson: { documentId: doc.id, previous: prev.status, next: input.status },
    createdByUserId: input.actorUserId ?? undefined,
  });
  return doc;
}
