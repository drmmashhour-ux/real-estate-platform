import type { RequestCommunicationChannel, RequestCommunicationDirection } from "@prisma/client";

export type { RequestCommunicationChannel, RequestCommunicationDirection };

export type CommunicationDraftInput = {
  dealRequestId: string;
  channel: RequestCommunicationChannel;
  direction: RequestCommunicationDirection;
  subject?: string | null;
  body?: string | null;
  metadata?: Record<string, unknown>;
};
