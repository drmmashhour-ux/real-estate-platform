import type { ConversationType } from "@prisma/client";

/**
 * View models for the Communication Center. The database uses
 * `Conversation` + `ConversationParticipant` (not a single `brokerId` / `clientId` pair);
 * those roles are derived from participants and `User.role`.
 */
export type ConversationContextModel = {
  listing: { id: string; title: string; listingCode: string | null } | null;
  offer: { id: string } | null;
  contract: { id: string; title: string } | null;
  appointment: { id: string; title: string } | null;
  brokerClient: { id: string; fullName: string } | null;
};

export type ConversationParticipantView = {
  userId: string;
  name: string | null;
  email: string;
  isArchived?: boolean;
  lastReadAt?: string | null;
};

export type ConversationThreadView = {
  id: string;
  type: ConversationType;
  subject: string | null;
  lastMessageAt: string | null;
  createdAt: string;
  participants: ConversationParticipantView[];
  context: ConversationContextModel;
};

export function otherParticipantName(
  detail: { participants: ConversationParticipantView[]; subject: string | null },
  viewerId: string
): string {
  const other = detail.participants.find((p) => p.userId !== viewerId);
  if (other) return other.name || other.email;
  return detail.subject?.trim() || "Conversation";
}
