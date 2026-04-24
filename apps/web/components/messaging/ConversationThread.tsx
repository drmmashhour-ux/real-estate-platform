"use client";

import type { ReactNode } from "react";
import type { ConversationType, MessageType } from "@prisma/client";
import { MessageComposer } from "@/components/messaging/MessageComposer";
import { VoiceMessageBubble } from "@/components/messaging/VoiceMessageBubble";
import { isPublicDemoMode } from "@/lib/demo-mode";
import type { MessageMetadata } from "@/modules/messaging/message.model";
import { isVoicePayload } from "@/modules/messaging/voice/voice.types";

export type ThreadMessage = {
  id: string;
  body: string;
  messageType: MessageType;
  metadata?: MessageMetadata | null;
  createdAt: string;
  senderId: string;
  sender: { name: string | null; email: string };
};

export type ThreadDetail = {
  id: string;
  type: ConversationType;
  subject: string | null;
  participants: { userId: string; name: string | null; email: string }[];
  context: {
    listing: { id: string; title: string } | null;
    fsboListing: { id: string; title: string; listingCode: string | null } | null;
    offer: { id: string } | null;
    contract: { id: string; title: string } | null;
    appointment: { id: string; title: string } | null;
    brokerClient: { id: string; fullName: string } | null;
  };
};

type Props = {
  viewerId: string;
  detail: ThreadDetail | null;
  messages: ThreadMessage[];
  canSend: boolean;
  onSend: (body: string) => Promise<void>;
  onMarkRead: () => Promise<void>;
  composerAppendDraft?: { nonce: number; text: string } | null;
  /** AI assistant draft text — optional "Use suggestion" in composer (does not send) */
  assistantSuggestionText?: string | null;
  onUseAssistantSuggestion?: () => void;
  /** AI bar or consent — rendered above the composer */
  composerExtras?: ReactNode;
  onSendVoice?: (blob: Blob, durationSec: number, mimeType: string) => Promise<void>;
  /** Phase 2: Twilio/WebRTC bridge URL */
  phase2CallUrl?: string | null;
};

const TYPE_LABEL: Record<ConversationType, string> = {
  DIRECT: "Direct",
  LISTING: "Listing",
  OFFER: "Offer",
  CONTRACT: "Contract",
  APPOINTMENT: "Appointment",
  CLIENT_THREAD: "Client",
  SUPPORT: "Support",
};

function contextBlurb(d: ThreadDetail): string | null {
  if (d.context.listing) return `Listing · ${d.context.listing.title}`;
  if (d.context.fsboListing) return `FSBO · ${d.context.fsboListing.title}`;
  if (d.context.offer) return `Offer · ${d.context.offer.id.slice(0, 8)}…`;
  if (d.context.contract) return `Contract · ${d.context.contract.title || d.context.contract.id.slice(0, 8)}`;
  if (d.context.appointment) return `Appointment · ${d.context.appointment.title}`;
  if (d.context.brokerClient) return `Client · ${d.context.brokerClient.fullName}`;
  return null;
}

export function ConversationThread({
  viewerId,
  detail,
  messages,
  canSend,
  onSend,
  onMarkRead,
  composerAppendDraft,
  assistantSuggestionText,
  onUseAssistantSuggestion,
  composerExtras,
  onSendVoice,
  phase2CallUrl,
}: Props) {
  const demo = isPublicDemoMode();

  if (!detail) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-slate-500">
        Select a conversation
      </div>
    );
  }

  const title =
    detail.subject ||
    detail.participants
      .filter((p) => p.userId !== viewerId)
      .map((p) => p.name || p.email)
      .join(", ") ||
    "Conversation";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="border-b border-white/10 bg-black/30 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase text-slate-400">
              {TYPE_LABEL[detail.type]}
            </span>
          </div>
          {phase2CallUrl ? (
            <a
              href={phase2CallUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-xs font-medium text-slate-100 hover:bg-white/10"
            >
              Call
            </a>
          ) : (
            <span className="text-[10px] text-slate-600" title="Configure NEXT_PUBLIC_MESSAGES_CALL_BRIDGE_URL">
              Call · phase 2
            </span>
          )}
        </div>
        {contextBlurb(detail) ? (
          <p className="mt-1 text-xs text-slate-400">{contextBlurb(detail)}</p>
        ) : null}
        <p className="mt-2 text-xs text-slate-500">
          This conversation is tied to this item on the platform.
        </p>
        {demo ? (
          <p className="mt-1 text-[10px] text-amber-200/80">
            This is a demo conversation environment. No external message is sent.
          </p>
        ) : null}
      </header>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m) => {
          const mine = m.senderId === viewerId;
          const system = m.messageType === "SYSTEM";
          const aiNote = m.messageType === "NOTE" && m.metadata?.source === "ai_draft";
          const meta = m.metadata as MessageMetadata | null | undefined;
          const voicePayload =
            m.messageType === "VOICE" && meta && isVoicePayload(meta)
              ? meta
              : meta && isVoicePayload(meta)
                ? meta
                : null;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[min(100%,520px)] rounded-2xl px-3 py-2 text-sm ${
                  system
                    ? "border border-amber-500/30 bg-amber-950/40 text-amber-100/90"
                    : aiNote
                      ? "border border-violet-500/30 bg-violet-950/45 text-violet-50"
                      : voicePayload
                        ? mine
                          ? "bg-emerald-950/55 text-emerald-50"
                          : "border border-white/10 bg-slate-900/60 text-slate-100"
                        : mine
                          ? "bg-emerald-900/50 text-emerald-50"
                          : "border border-white/10 bg-white/5 text-slate-100"
                }`}
              >
                {!system && !mine ? (
                  <p className="mb-1 text-[10px] uppercase tracking-wide text-slate-500">
                    {m.sender.name || m.sender.email}
                  </p>
                ) : null}
                {system ? <p className="text-[10px] font-semibold uppercase text-amber-200/80">System</p> : null}
                {aiNote ? (
                  <p className="mb-1 text-[10px] font-semibold uppercase text-violet-200/90">AI suggestion</p>
                ) : null}
                {voicePayload ? (
                  <VoiceMessageBubble payload={voicePayload} />
                ) : (
                  <p className="whitespace-pre-wrap">{m.body}</p>
                )}
                <p className="mt-1 text-[10px] text-slate-500">
                  {new Date(m.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {composerExtras}
      <MessageComposer
        disabled={!canSend}
        disabledReason={!canSend ? "You can view this thread but not send messages." : undefined}
        appendDraft={composerAppendDraft ?? null}
        assistantDraftHint={assistantSuggestionText ?? null}
        onUseAssistantDraft={onUseAssistantSuggestion}
        onSendVoice={onSendVoice}
        onSend={async (body) => {
          await onSend(body);
          await onMarkRead();
        }}
      />
    </div>
  );
}
