import type { DocumentFolder, DocumentFolderType } from "@prisma/client";
import { DocumentEventType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logDocumentEvent } from "@/modules/documents/services/log-document-event";
import type { ContextKind } from "@/modules/messaging/services/messaging-permissions";

export type FolderContext =
  | { kind: "listing"; id: string }
  | { kind: "client"; id: string }
  | { kind: "offer"; id: string }
  | { kind: "contract"; id: string }
  | { kind: "appointment"; id: string }
  | { kind: "conversation"; id: string };

function folderTypeForContext(k: FolderContext["kind"]): DocumentFolderType {
  switch (k) {
    case "listing":
      return "LISTING_ROOM";
    case "client":
      return "CLIENT_ROOM";
    case "offer":
      return "OFFER_ROOM";
    case "contract":
      return "CONTRACT_ROOM";
    case "appointment":
      return "APPOINTMENT_ROOM";
    case "conversation":
      return "CONVERSATION_ROOM";
  }
}

async function resolveFolderName(ctx: FolderContext): Promise<string> {
  switch (ctx.kind) {
    case "listing": {
      const l = await prisma.listing.findUnique({
        where: { id: ctx.id },
        select: { title: true, listingCode: true },
      });
      return l ? `Property · ${l.title}` : "Listing room";
    }
    case "client": {
      const c = await prisma.brokerClient.findUnique({
        where: { id: ctx.id },
        select: { fullName: true },
      });
      return c ? `Client · ${c.fullName}` : "Client room";
    }
    case "offer":
      return "Offer room";
    case "contract": {
      const c = await prisma.contract.findUnique({
        where: { id: ctx.id },
        select: { title: true },
      });
      return c?.title?.trim() ? `Contract · ${c.title}` : "Contract room";
    }
    case "appointment": {
      const a = await prisma.appointment.findUnique({
        where: { id: ctx.id },
        select: { title: true },
      });
      return a ? `Appointment · ${a.title}` : "Appointment room";
    }
    case "conversation":
      return "Conversation files";
    default:
      return "Documents";
  }
}

function whereForContext(ctx: FolderContext): Record<string, unknown> {
  switch (ctx.kind) {
    case "listing":
      return { listingId: ctx.id };
    case "client":
      return { brokerClientId: ctx.id };
    case "offer":
      return { offerId: ctx.id };
    case "contract":
      return { contractId: ctx.id };
    case "appointment":
      return { appointmentId: ctx.id };
    case "conversation":
      return { conversationId: ctx.id };
  }
}

export async function getOrCreateFolderForContext(
  ctx: FolderContext,
  createdById: string
): Promise<DocumentFolder> {
  const type = folderTypeForContext(ctx.kind);
  const existing = await prisma.documentFolder.findFirst({
    where: {
      type,
      ...whereForContext(ctx),
    },
  });
  if (existing) return existing;

  const name = await resolveFolderName(ctx);

  const folder = await prisma.documentFolder.create({
    data: {
      name,
      type,
      createdById,
      listingId: ctx.kind === "listing" ? ctx.id : null,
      brokerClientId: ctx.kind === "client" ? ctx.id : null,
      offerId: ctx.kind === "offer" ? ctx.id : null,
      contractId: ctx.kind === "contract" ? ctx.id : null,
      appointmentId: ctx.kind === "appointment" ? ctx.id : null,
      conversationId: ctx.kind === "conversation" ? ctx.id : null,
    },
  });
  await logDocumentEvent({
    type: DocumentEventType.FOLDER_CREATED,
    actorId: createdById,
    folderId: folder.id,
    message: name,
    metadata: { contextKind: ctx.kind },
  });
  return folder;
}

export async function getOrCreateFolderFromMessagingContext(
  kind: ContextKind,
  contextId: string,
  userId: string
): Promise<DocumentFolder> {
  const map: Record<ContextKind, FolderContext> = {
    listing: { kind: "listing", id: contextId },
    client: { kind: "client", id: contextId },
    offer: { kind: "offer", id: contextId },
    contract: { kind: "contract", id: contextId },
    appointment: { kind: "appointment", id: contextId },
  };
  return getOrCreateFolderForContext(map[kind], userId);
}

export async function createFolderForListing(listingId: string, userId: string) {
  return getOrCreateFolderForContext({ kind: "listing", id: listingId }, userId);
}
export async function createFolderForBrokerClient(brokerClientId: string, userId: string) {
  return getOrCreateFolderForContext({ kind: "client", id: brokerClientId }, userId);
}
export async function createFolderForOffer(offerId: string, userId: string) {
  return getOrCreateFolderForContext({ kind: "offer", id: offerId }, userId);
}
export async function createFolderForContract(contractId: string, userId: string) {
  return getOrCreateFolderForContext({ kind: "contract", id: contractId }, userId);
}
export async function createFolderForAppointment(appointmentId: string, userId: string) {
  return getOrCreateFolderForContext({ kind: "appointment", id: appointmentId }, userId);
}
export async function createFolderForConversation(conversationId: string, userId: string) {
  return getOrCreateFolderForContext({ kind: "conversation", id: conversationId }, userId);
}
