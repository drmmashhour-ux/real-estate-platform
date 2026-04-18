import type { BrokerCollaborationMessageType, BrokerCollaborationVisibilityScope, BrokerInternalNoteType } from "@prisma/client";

export type { BrokerCollaborationMessageType, BrokerCollaborationVisibilityScope, BrokerInternalNoteType };

export type CreateThreadInput = {
  teamId?: string | null;
  dealId?: string | null;
  listingId?: string | null;
  lecipmContactId?: string | null;
  visibilityScope: BrokerCollaborationVisibilityScope;
  title?: string | null;
};

export type PostMessageInput = {
  body: string;
  messageType?: BrokerCollaborationMessageType;
  metadata?: Record<string, unknown>;
};

export type CreateInternalNoteInput = {
  dealId?: string | null;
  listingId?: string | null;
  lecipmContactId?: string | null;
  visibilityScope: BrokerCollaborationVisibilityScope;
  noteType: BrokerInternalNoteType;
  body: string;
  metadata?: Record<string, unknown>;
};
