import type { Conversation, ConversationParticipant, PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getContractForAccess, resolveListingOwnerId, canAccessContract } from "@/modules/contracts/services/access";
import { canViewOffer, isBrokerLikeRole } from "@/modules/offers/services/offer-access";
import { canViewAppointment } from "@/modules/scheduling/services/appointment-permissions";
import type { AppointmentViewer } from "@/modules/scheduling/services/appointment-permissions";

export type UserForMessaging = { id: string; role: PlatformRole };

function isParticipant(
  userId: string,
  participants: Pick<ConversationParticipant, "userId">[]
): boolean {
  return participants.some((p) => p.userId === userId);
}

export function canViewConversation(
  user: UserForMessaging,
  _conversation: Pick<Conversation, "id">,
  participants: Pick<ConversationParticipant, "userId">[]
): boolean {
  if (user.role === "ADMIN") return true;
  return isParticipant(user.id, participants);
}

/** Send text/notes: participants only (admin must be in the thread to send). */
export function canSendMessage(
  user: UserForMessaging,
  _conversation: Pick<Conversation, "id">,
  participants: Pick<ConversationParticipant, "userId">[]
): boolean {
  return isParticipant(user.id, participants);
}

export function canArchiveConversation(
  user: UserForMessaging,
  _conversation: Pick<Conversation, "id">,
  participants: Pick<ConversationParticipant, "userId">[]
): boolean {
  return isParticipant(user.id, participants);
}

export type ContextKind = "listing" | "offer" | "contract" | "appointment" | "client";

export async function canCreateContextConversation(
  user: UserForMessaging,
  contextType: ContextKind,
  contextId: string
): Promise<boolean> {
  switch (contextType) {
    case "listing": {
      const listing = await prisma.listing.findUnique({
        where: { id: contextId },
        select: {
          ownerId: true,
          brokerAccesses: { select: { brokerId: true } },
        },
      });
      if (!listing) return false;
      if (user.role === "ADMIN") return true;
      if (listing.ownerId === user.id) return true;
      if (listing.brokerAccesses.some((a) => a.brokerId === user.id)) return true;
      const offer = await prisma.offer.findFirst({
        where: { listingId: contextId, buyerId: user.id },
        select: { id: true },
      });
      if (offer) return true;
      const appt = await prisma.appointment.findFirst({
        where: {
          listingId: contextId,
          OR: [{ clientUserId: user.id }, { brokerId: user.id }],
        },
        select: { id: true },
      });
      if (appt) return true;
      return false;
    }
    case "offer": {
      const offer = await prisma.offer.findUnique({
        where: { id: contextId },
        select: { buyerId: true, brokerId: true, status: true },
      });
      if (!offer) return false;
      return canViewOffer({ userId: user.id, role: user.role, offer });
    }
    case "contract": {
      const c = await getContractForAccess(contextId);
      if (!c) return false;
      const listingOwnerId = await resolveListingOwnerId(c);
      return canAccessContract(user.id, user.role, c, listingOwnerId);
    }
    case "appointment": {
      const appt = await prisma.appointment.findUnique({
        where: { id: contextId },
        include: {
          broker: { select: { id: true, role: true } },
          clientUser: { select: { id: true, role: true } },
          brokerClient: true,
        },
      });
      if (!appt) return false;
      const viewer: AppointmentViewer = user;
      return canViewAppointment(viewer, appt);
    }
    case "client": {
      const bc = await prisma.brokerClient.findUnique({
        where: { id: contextId },
        select: { brokerId: true, userId: true },
      });
      if (!bc) return false;
      if (user.role === "ADMIN") return true;
      if (bc.brokerId === user.id) return true;
      if (bc.userId === user.id) return true;
      return false;
    }
    default:
      return false;
  }
}

export async function canAccessConversationContext(
  user: UserForMessaging,
  conversation: Pick<
    Conversation,
    "type" | "listingId" | "offerId" | "contractId" | "appointmentId" | "brokerClientId"
  >
): Promise<boolean> {
  if (
    !conversation.listingId &&
    !conversation.offerId &&
    !conversation.contractId &&
    !conversation.appointmentId &&
    !conversation.brokerClientId
  ) {
    return true;
  }
  if (conversation.listingId) {
    return canCreateContextConversation(user, "listing", conversation.listingId);
  }
  if (conversation.offerId) {
    return canCreateContextConversation(user, "offer", conversation.offerId);
  }
  if (conversation.contractId) {
    return canCreateContextConversation(user, "contract", conversation.contractId);
  }
  if (conversation.appointmentId) {
    return canCreateContextConversation(user, "appointment", conversation.appointmentId);
  }
  if (conversation.brokerClientId) {
    return canCreateContextConversation(user, "client", conversation.brokerClientId);
  }
  return true;
}

/** Direct thread: broker↔linked CRM client, buyer↔assigned broker, or admin. */
export async function canCreateDirectConversation(
  user: UserForMessaging,
  otherUserId: string
): Promise<boolean> {
  if (user.id === otherUserId) return false;
  if (user.role === "ADMIN") return true;
  const crm = await prisma.brokerClient.findFirst({
    where: {
      OR: [
        { brokerId: user.id, userId: otherUserId },
        { brokerId: otherUserId, userId: user.id },
      ],
    },
    select: { id: true },
  });
  if (crm) return true;
  const buyerBroker = await prisma.buyerRequest.findFirst({
    where: {
      OR: [
        { userId: user.id, assignedBrokerId: otherUserId },
        { userId: otherUserId, assignedBrokerId: user.id },
      ],
    },
    select: { id: true },
  });
  if (buyerBroker) return true;
  if (isBrokerLikeRole(user.role)) {
    const clientRow = await prisma.brokerClient.findFirst({
      where: { brokerId: user.id, userId: otherUserId },
      select: { id: true },
    });
    return !!clientRow;
  }
  return false;
}
