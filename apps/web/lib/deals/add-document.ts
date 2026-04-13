import type { DealDocumentRefType, DealDocumentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { DEAL_ROOM_EVENT } from "./constants";
import { addDealRoomEvent } from "./add-event";

export async function addDealRoomDocument(input: {
  dealRoomId: string;
  documentType: string;
  documentRefType: DealDocumentRefType;
  documentRefId?: string | null;
  status?: DealDocumentStatus;
  title: string;
  actorUserId?: string | null;
}) {
  const doc = await prisma.dealRoomDocument.create({
    data: {
      dealRoomId: input.dealRoomId,
      documentType: input.documentType,
      documentRefType: input.documentRefType,
      documentRefId: input.documentRefId ?? undefined,
      status: input.status ?? "requested",
      title: input.title,
    },
  });
  await addDealRoomEvent({
    dealRoomId: input.dealRoomId,
    eventType: DEAL_ROOM_EVENT.DOCUMENT_ADDED,
    title: `Document: ${input.title}`,
    metadataJson: { documentId: doc.id, documentRefType: input.documentRefType },
    createdByUserId: input.actorUserId ?? undefined,
  });
  return doc;
}
