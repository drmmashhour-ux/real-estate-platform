import type { MessageType } from "@prisma/client";

export type MessageMetadata = {
  /** Persisted drafts / assistant notes */
  source?: "ai_draft" | "system_outreach";
  outreachKind?: "new_lead" | "no_reply_24h" | "property_viewed";
  consentAck?: boolean;
  /** When `messageType` is VOICE, same object as `VoiceMessagePayload` in Prisma `metadata` JSON. */
  type?: "VOICE";
  audioUrl?: string;
  durationSec?: number;
  mimeType?: string;
};

export type ChatMessageView = {
  id: string;
  body: string;
  messageType: MessageType;
  createdAt: string;
  senderId: string;
  sender: { name: string | null; email: string };
  metadata?: MessageMetadata | null;
};

export function isAiAssistantNote(m: Pick<ChatMessageView, "messageType" | "metadata">): boolean {
  return m.messageType === "NOTE" && m.metadata?.source === "ai_draft";
}

export function isSystemMessage(m: Pick<ChatMessageView, "messageType">): boolean {
  return m.messageType === "SYSTEM";
}
