import type { DocumentFile, DocumentFolder, PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isBrokerLikeRole } from "@/modules/offers/services/offer-access";
import {
  canCreateContextConversation,
  type ContextKind,
} from "@/modules/messaging/services/messaging-permissions";

export type UserForDocuments = { id: string; role: PlatformRole };

export async function canUploadToContext(
  user: UserForDocuments,
  contextType: ContextKind,
  contextId: string
): Promise<boolean> {
  return canCreateContextConversation(user, contextType, contextId);
}

/** View or upload access to a workflow-linked document context (same gate as messaging context). */
export async function canAccessDocumentContext(
  user: UserForDocuments,
  contextType: ContextKind | "conversation",
  contextId: string
): Promise<boolean> {
  if (user.role === "ADMIN") return true;
  if (contextType === "conversation") {
    return canAccessConversationDocuments(user, contextId);
  }
  return canCreateContextConversation(user, contextType, contextId);
}

export async function canAccessConversationDocuments(
  user: UserForDocuments,
  conversationId: string
): Promise<boolean> {
  if (user.role === "ADMIN") return true;
  const p = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: { conversationId, userId: user.id },
    },
    select: { id: true },
  });
  return !!p;
}

/** Folder access mirrors upload permission for its primary context. */
export async function canAccessFolder(user: UserForDocuments, folder: DocumentFolder): Promise<boolean> {
  if (user.role === "ADMIN") return true;
  if (folder.createdById === user.id) return true;
  if (folder.listingId) {
    return canUploadToContext(user, "listing", folder.listingId);
  }
  if (folder.brokerClientId) {
    return canUploadToContext(user, "client", folder.brokerClientId);
  }
  if (folder.offerId) {
    return canUploadToContext(user, "offer", folder.offerId);
  }
  if (folder.contractId) {
    return canUploadToContext(user, "contract", folder.contractId);
  }
  if (folder.appointmentId) {
    return canUploadToContext(user, "appointment", folder.appointmentId);
  }
  if (folder.conversationId) {
    return canAccessConversationDocuments(user, folder.conversationId);
  }
  return false;
}

async function userHasWorkflowAccessToFile(
  user: UserForDocuments,
  file: Pick<
    DocumentFile,
    | "listingId"
    | "brokerClientId"
    | "offerId"
    | "contractId"
    | "appointmentId"
    | "conversationId"
  >
): Promise<boolean> {
  if (user.role === "ADMIN") return true;
  if (file.listingId) {
    return canUploadToContext(user, "listing", file.listingId);
  }
  if (file.brokerClientId) {
    return canUploadToContext(user, "client", file.brokerClientId);
  }
  if (file.offerId) {
    return canUploadToContext(user, "offer", file.offerId);
  }
  if (file.contractId) {
    return canUploadToContext(user, "contract", file.contractId);
  }
  if (file.appointmentId) {
    return canUploadToContext(user, "appointment", file.appointmentId);
  }
  if (file.conversationId) {
    return canAccessConversationDocuments(user, file.conversationId);
  }
  return false;
}

export async function canViewDocument(
  user: UserForDocuments,
  file: DocumentFile & { accessGrants?: { userId: string }[] }
): Promise<boolean> {
  if (user.role === "ADMIN") return true;
  if (file.status === "DELETED") return false;
  if (file.uploadedById === user.id) return true;
  if (file.accessGrants?.some((g) => g.userId === user.id)) return true;

  const visibility = file.visibility;
  if (visibility === "ADMIN_ONLY") {
    return false;
  }
  if (visibility === "PRIVATE_INTERNAL") {
    return userHasWorkflowAccessToFile(user, file);
  }
  if (visibility === "BROKER_ONLY") {
    return isBrokerLikeRole(user.role);
  }
  if (visibility === "CLIENT_VISIBLE") {
    const wf = await userHasWorkflowAccessToFile(user, file);
    if (wf) return true;
    if (
      user.role === "USER" ||
      user.role === "CLIENT" ||
      user.role === "TESTER" ||
      user.role === "BUYER" ||
      user.role === "SELLER_DIRECT"
    ) {
      return offerBuyerOrAppointmentClient(user, file);
    }
    return false;
  }
  if (visibility === "SHARED_PARTICIPANTS") {
    return userHasWorkflowAccessToFile(user, file);
  }
  return false;
}

async function offerBuyerOrAppointmentClient(
  user: UserForDocuments,
  file: Pick<DocumentFile, "offerId" | "appointmentId">
): Promise<boolean> {
  if (file.offerId) {
    const o = await prisma.offer.findUnique({
      where: { id: file.offerId },
      select: { buyerId: true },
    });
    return o?.buyerId === user.id;
  }
  if (file.appointmentId) {
    const a = await prisma.appointment.findUnique({
      where: { id: file.appointmentId },
      select: { clientUserId: true },
    });
    return a?.clientUserId === user.id;
  }
  return false;
}

export async function canManageDocument(
  user: UserForDocuments,
  file: DocumentFile
): Promise<boolean> {
  if (user.role === "ADMIN") return true;
  if (file.uploadedById === user.id) return true;
  if (file.status === "DELETED") return false;
  return (await userHasWorkflowAccessToFile(user, file)) && isBrokerLikeRole(user.role);
}

export async function canShareDocument(
  user: UserForDocuments,
  file: DocumentFile
): Promise<boolean> {
  return canManageDocument(user, file);
}

export async function canDownloadDocument(
  user: UserForDocuments,
  file: DocumentFile & { accessGrants?: { userId: string }[] }
): Promise<boolean> {
  return canViewDocument(user, file);
}

export { canCreateContextConversation };
export type { ContextKind };
