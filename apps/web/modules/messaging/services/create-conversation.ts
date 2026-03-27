import type { Conversation, ConversationType, Prisma } from "@prisma/client";
import { MessageEventType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getContractForAccess } from "@/modules/contracts/services/access";
import type { ContextKind } from "@/modules/messaging/services/messaging-permissions";
import { canCreateContextConversation } from "@/modules/messaging/services/messaging-permissions";

export async function resolveListingBrokerUserId(listingId: string): Promise<string | null> {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { ownerId: true },
  });
  if (!listing) return null;
  if (listing.ownerId) {
    const owner = await prisma.user.findUnique({
      where: { id: listing.ownerId },
      select: { role: true },
    });
    if (owner && (owner.role === "BROKER" || owner.role === "ADMIN")) {
      return listing.ownerId;
    }
  }
  const access = await prisma.brokerListingAccess.findFirst({
    where: { listingId },
    orderBy: { grantedAt: "asc" },
    select: { brokerId: true },
  });
  return access?.brokerId ?? listing.ownerId ?? null;
}

async function findExistingPairConversation(
  tx: Prisma.TransactionClient,
  filter: {
    type: ConversationType;
    listingId?: string | null;
    offerId?: string | null;
    contractId?: string | null;
    appointmentId?: string | null;
    brokerClientId?: string | null;
  },
  userA: string,
  userB: string
): Promise<Conversation | null> {
  const where: Prisma.ConversationWhereInput = { type: filter.type };
  if (filter.listingId !== undefined) where.listingId = filter.listingId;
  if (filter.offerId !== undefined) where.offerId = filter.offerId;
  if (filter.contractId !== undefined) where.contractId = filter.contractId;
  if (filter.appointmentId !== undefined) where.appointmentId = filter.appointmentId;
  if (filter.brokerClientId !== undefined) where.brokerClientId = filter.brokerClientId;

  const convs = await tx.conversation.findMany({
    where,
    include: { participants: true },
  });
  const need = new Set([userA, userB]);
  for (const c of convs) {
    if (c.participants.length !== 2) continue;
    const p = new Set(c.participants.map((x) => x.userId));
    if (need.size === p.size && [...need].every((u) => p.has(u))) {
      return c;
    }
  }
  return null;
}

async function emitConversationCreated(
  tx: Prisma.TransactionClient,
  conversationId: string,
  actorId: string | null
) {
  await tx.messageEvent.create({
    data: {
      conversationId,
      actorId,
      type: MessageEventType.CONVERSATION_CREATED,
    },
  });
}

async function createConversationWithParticipants(params: {
  tx: Prisma.TransactionClient;
  type: ConversationType;
  createdById: string | null;
  subject: string | null;
  listingId?: string | null;
  offerId?: string | null;
  contractId?: string | null;
  appointmentId?: string | null;
  brokerClientId?: string | null;
  participantUserIds: string[];
}): Promise<Conversation> {
  const unique = [...new Set(params.participantUserIds)];
  if (unique.length < 2) {
    throw new Error("At least two participants are required");
  }
  const conv = await params.tx.conversation.create({
    data: {
      type: params.type,
      createdById: params.createdById,
      subject: params.subject,
      listingId: params.listingId ?? null,
      offerId: params.offerId ?? null,
      contractId: params.contractId ?? null,
      appointmentId: params.appointmentId ?? null,
      brokerClientId: params.brokerClientId ?? null,
      participants: {
        create: unique.map((userId) => ({
          userId,
          roleLabel: null,
        })),
      },
    },
  });
  await emitConversationCreated(params.tx, conv.id, params.createdById);
  return conv;
}

export async function createDirectConversation(params: {
  createdById: string;
  participantUserId: string;
}): Promise<{ conversation: Conversation; created: boolean }> {
  const { createdById, participantUserId } = params;
  if (createdById === participantUserId) {
    throw new Error("Invalid participants");
  }
  return prisma.$transaction(async (tx) => {
    const existing = await findExistingPairConversation(
      tx,
      {
        type: "DIRECT",
        listingId: null,
        offerId: null,
        contractId: null,
        appointmentId: null,
        brokerClientId: null,
      },
      createdById,
      participantUserId
    );
    if (existing) return { conversation: existing, created: false };

    const conv = await createConversationWithParticipants({
      tx,
      type: "DIRECT",
      createdById,
      subject: null,
      listingId: null,
      offerId: null,
      contractId: null,
      appointmentId: null,
      brokerClientId: null,
      participantUserIds: [createdById, participantUserId],
    });
    return { conversation: conv, created: true };
  });
}

export async function createListingConversation(params: {
  listingId: string;
  createdById: string;
}): Promise<{ conversation: Conversation; created: boolean }> {
  const { listingId, createdById } = params;
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, title: true, ownerId: true, listingCode: true },
  });
  if (!listing) throw new Error("Listing not found");

  const brokerId = await resolveListingBrokerUserId(listingId);
  if (!brokerId) throw new Error("No broker for listing");

  let otherId: string;
  if (createdById === brokerId) {
    if (listing.ownerId && listing.ownerId !== brokerId) {
      otherId = listing.ownerId;
    } else {
      throw new Error("No counterparty for listing thread");
    }
  } else {
    otherId = brokerId;
  }

  const subject = listing.title ? `Listing: ${listing.title}` : `Listing ${listing.listingCode ?? listing.id.slice(0, 8)}`;

  return prisma.$transaction(async (tx) => {
    const existing = await findExistingPairConversation(
      tx,
      {
        type: "LISTING",
        listingId,
        offerId: null,
        contractId: null,
        appointmentId: null,
        brokerClientId: null,
      },
      createdById,
      otherId
    );
    if (existing) return { conversation: existing, created: false };

    const conv = await createConversationWithParticipants({
      tx,
      type: "LISTING",
      createdById,
      subject,
      listingId,
      participantUserIds: [createdById, otherId],
    });
    return { conversation: conv, created: true };
  });
}

export async function createOfferConversation(params: {
  offerId: string;
  createdById: string;
}): Promise<{ conversation: Conversation; created: boolean }> {
  const offer = await prisma.offer.findUnique({
    where: { id: params.offerId },
    select: { id: true, listingId: true, buyerId: true, brokerId: true },
  });
  if (!offer) throw new Error("Offer not found");

  let brokerId = offer.brokerId;
  if (!brokerId) {
    brokerId = await resolveListingBrokerUserId(offer.listingId);
  }
  if (!brokerId) throw new Error("No broker for offer");

  const buyerId = offer.buyerId;
  const listing = await prisma.listing.findUnique({
    where: { id: offer.listingId },
    select: { title: true },
  });
  const subject = listing?.title ? `Offer · ${listing.title}` : "Offer";

  return prisma.$transaction(async (tx) => {
    const existing = await findExistingPairConversation(
      tx,
      {
        type: "OFFER",
        offerId: offer.id,
        listingId: null,
        contractId: null,
        appointmentId: null,
        brokerClientId: null,
      },
      buyerId,
      brokerId
    );
    if (existing) return { conversation: existing, created: false };

    const conv = await createConversationWithParticipants({
      tx,
      type: "OFFER",
      createdById: params.createdById,
      subject,
      offerId: offer.id,
      participantUserIds: [buyerId, brokerId],
    });
    return { conversation: conv, created: true };
  });
}

export async function createContractConversation(params: {
  contractId: string;
  createdById: string;
}): Promise<{ conversation: Conversation; created: boolean }> {
  const c = await getContractForAccess(params.contractId);
  if (!c) throw new Error("Contract not found");

  const ids = new Set<string>();
  ids.add(c.userId);
  if (c.createdById) ids.add(c.createdById);
  for (const s of c.signatures) {
    if (s.userId) ids.add(s.userId);
  }
  const participants = [...ids];
  if (participants.length < 2) {
    throw new Error("Contract needs at least two platform users for messaging");
  }

  const subject = c.title?.trim() || "Contract";

  return prisma.$transaction(async (tx) => {
    const existing = await tx.conversation.findFirst({
      where: { type: "CONTRACT", contractId: c.id },
    });
    if (existing) return { conversation: existing, created: false };

    const conv = await createConversationWithParticipants({
      tx,
      type: "CONTRACT",
      createdById: params.createdById,
      subject,
      contractId: c.id,
      participantUserIds: participants,
    });
    return { conversation: conv, created: true };
  });
}

export async function createAppointmentConversation(params: {
  appointmentId: string;
  createdById: string;
}): Promise<{ conversation: Conversation; created: boolean }> {
  const appt = await prisma.appointment.findUnique({
    where: { id: params.appointmentId },
    select: {
      id: true,
      title: true,
      brokerId: true,
      clientUserId: true,
      brokerClientId: true,
    },
  });
  if (!appt) throw new Error("Appointment not found");

  let clientId = appt.clientUserId;
  if (!clientId && appt.brokerClientId) {
    const bc = await prisma.brokerClient.findUnique({
      where: { id: appt.brokerClientId },
      select: { userId: true },
    });
    clientId = bc?.userId ?? null;
  }
  if (!clientId) {
    throw new Error("Appointment has no linked client user for messaging");
  }

  const subject = appt.title?.trim() || "Appointment";

  return prisma.$transaction(async (tx) => {
    const existing = await findExistingPairConversation(
      tx,
      {
        type: "APPOINTMENT",
        appointmentId: appt.id,
        listingId: null,
        offerId: null,
        contractId: null,
        brokerClientId: null,
      },
      appt.brokerId,
      clientId
    );
    if (existing) return { conversation: existing, created: false };

    const conv = await createConversationWithParticipants({
      tx,
      type: "APPOINTMENT",
      createdById: params.createdById,
      subject,
      appointmentId: appt.id,
      participantUserIds: [appt.brokerId, clientId],
    });
    return { conversation: conv, created: true };
  });
}

export async function createBrokerClientConversation(params: {
  brokerClientId: string;
  createdById: string;
}): Promise<{ conversation: Conversation; created: boolean }> {
  const bc = await prisma.brokerClient.findUnique({
    where: { id: params.brokerClientId },
    select: { id: true, brokerId: true, userId: true, fullName: true },
  });
  if (!bc) throw new Error("Client not found");
  if (!bc.userId) throw new Error("Client has no linked platform user");

  const subject = bc.fullName ? `Client: ${bc.fullName}` : "Client thread";

  return prisma.$transaction(async (tx) => {
    const existing = await findExistingPairConversation(
      tx,
      {
        type: "CLIENT_THREAD",
        brokerClientId: bc.id,
        listingId: null,
        offerId: null,
        contractId: null,
        appointmentId: null,
      },
      bc.brokerId,
      bc.userId!
    );
    if (existing) return { conversation: existing, created: false };

    const conv = await createConversationWithParticipants({
      tx,
      type: "CLIENT_THREAD",
      createdById: params.createdById,
      subject,
      brokerClientId: bc.id,
      participantUserIds: [bc.brokerId, bc.userId!],
    });
    return { conversation: conv, created: true };
  });
}

export async function getOrCreateConversationForContext(
  kind: ContextKind,
  contextId: string,
  userId: string
): Promise<{ conversation: Conversation; created: boolean }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!user) throw new Error("User not found");

  const ok = await canCreateContextConversation(user, kind, contextId);
  if (!ok) throw new Error("Forbidden");

  switch (kind) {
    case "listing":
      return createListingConversation({ listingId: contextId, createdById: userId });
    case "offer":
      return createOfferConversation({ offerId: contextId, createdById: userId });
    case "contract":
      return createContractConversation({ contractId: contextId, createdById: userId });
    case "appointment":
      return createAppointmentConversation({ appointmentId: contextId, createdById: userId });
    case "client":
      return createBrokerClientConversation({ brokerClientId: contextId, createdById: userId });
    default:
      throw new Error("Unsupported context");
  }
}
