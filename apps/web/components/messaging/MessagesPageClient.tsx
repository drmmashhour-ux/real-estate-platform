"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { PlatformRole } from "@prisma/client";
import { ConversationList } from "@/components/messaging/ConversationList";
import { ConversationThread, type ThreadDetail, type ThreadMessage } from "@/components/messaging/ConversationThread";
import { AiSuggestReplyBar } from "@/components/messaging/AiSuggestReplyBar";
import { ConversationInsightsPanel } from "@/components/messaging/ConversationInsightsPanel";
import { AutopilotChatBar } from "@/components/messaging/AutopilotChatBar";
import type { InboxConversationRow } from "@/modules/messaging/services/get-user-conversations";
import { ContentLicenseModal } from "@/components/legal/ContentLicenseModal";
import { CONTENT_LICENSE_ERROR, ContentLicenseRequiredError } from "@/lib/legal/content-license-client";
import { CONTENT_LICENSE_VERSION } from "@/modules/legal/content-license";

type Props = {
  viewerId: string;
  viewerRole?: PlatformRole;
};

const POLL_MS = 12_000;

export function MessagesPageClient({ viewerId, viewerRole }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialId = searchParams.get("conversationId");

  const [rows, setRows] = useState<InboxConversationRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(initialId);
  const [detail, setDetail] = useState<ThreadDetail | null>(null);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [licenseOpen, setLicenseOpen] = useState(false);
  const [licenseVersion, setLicenseVersion] = useState<string>(CONTENT_LICENSE_VERSION);
  const pendingSendRef = useRef<string | null>(null);
  const [composerAppendDraft, setComposerAppendDraft] = useState<{ nonce: number; text: string } | null>(null);
  const showAiSuggestions = viewerRole === "BROKER" || viewerRole === "ADMIN";
  const showBrokerInsights = showAiSuggestions;
  const phase2CallUrl =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_MESSAGES_CALL_BRIDGE_URL?.trim() || null
      : null;

  const loadList = useCallback(async () => {
    const res = await fetch("/api/conversations", { credentials: "same-origin" });
    const j = (await res.json()) as { conversations?: InboxConversationRow[] };
    if (res.ok && Array.isArray(j.conversations)) {
      setRows(j.conversations);
    }
  }, []);

  const loadThread = useCallback(
    async (id: string) => {
      setLoadingThread(true);
      try {
        const [cRes, mRes] = await Promise.all([
          fetch(`/api/conversations/${encodeURIComponent(id)}`, { credentials: "same-origin" }),
          fetch(`/api/conversations/${encodeURIComponent(id)}/messages`, { credentials: "same-origin" }),
        ]);
        const cj = (await cRes.json()) as { conversation?: ThreadDetail; error?: string };
        const mj = (await mRes.json()) as { messages?: ThreadMessage[] };
        if (cRes.ok && cj.conversation) {
          setDetail(cj.conversation);
        } else {
          setDetail(null);
        }
        if (mRes.ok && Array.isArray(mj.messages)) {
          setMessages(mj.messages);
        } else {
          setMessages([]);
        }
        if (cRes.ok) {
          await fetch(`/api/conversations/${encodeURIComponent(id)}/read`, {
            method: "POST",
            credentials: "same-origin",
          }).catch(() => {});
          void loadList();
        }
      } finally {
        setLoadingThread(false);
      }
    },
    [loadList]
  );

  useEffect(() => {
    void (async () => {
      setLoadingList(true);
      await loadList();
      setLoadingList(false);
    })();
  }, [loadList]);

  useEffect(() => {
    if (selectedId) {
      void loadThread(selectedId);
      router.replace(`/dashboard/messages?conversationId=${encodeURIComponent(selectedId)}`, {
        scroll: false,
      });
    }
  }, [selectedId, loadThread, router]);

  useEffect(() => {
    const t = window.setInterval(() => {
      void loadList();
      if (selectedId) void loadThread(selectedId);
    }, POLL_MS);
    return () => window.clearInterval(t);
  }, [loadList, loadThread, selectedId]);

  const canSend = !!detail?.participants.some((p) => p.userId === viewerId);

  const sendMessageBody = useCallback(
    async (body: string) => {
      if (!selectedId) return;
      const res = await fetch(`/api/conversations/${encodeURIComponent(selectedId)}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ body }),
      });
      const j = (await res.json()) as {
        error?: string;
        requiredVersion?: string;
        message?: string;
      };
      if (!res.ok) {
        if (j.error === CONTENT_LICENSE_ERROR && j.requiredVersion) {
          pendingSendRef.current = body;
          setLicenseVersion(j.requiredVersion);
          setLicenseOpen(true);
          throw new ContentLicenseRequiredError();
        }
        throw new Error(j.message ?? j.error ?? "Send failed");
      }
      await loadThread(selectedId);
    },
    [selectedId, loadThread]
  );

  const sendVoiceBody = useCallback(
    async (blob: Blob, durationSec: number, mimeType: string) => {
      if (!selectedId) return;
      const fd = new FormData();
      fd.append("audio", blob, "voice-message.webm");
      fd.append("durationSec", String(durationSec));
      fd.append("mimeType", mimeType);
      const res = await fetch(`/api/conversations/${encodeURIComponent(selectedId)}/voice`, {
        method: "POST",
        credentials: "same-origin",
        body: fd,
      });
      const j = (await res.json()) as {
        error?: string;
        requiredVersion?: string;
        message?: string;
      };
      if (!res.ok) {
        if (j.error === CONTENT_LICENSE_ERROR && j.requiredVersion) {
          setLicenseVersion(j.requiredVersion);
          setLicenseOpen(true);
          throw new ContentLicenseRequiredError();
        }
        throw new Error(j.message ?? j.error ?? "Voice upload failed");
      }
      await loadThread(selectedId);
    },
    [selectedId, loadThread]
  );

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col xl:flex-row">
      <aside className="w-full shrink-0 md:w-[340px]">
        {loadingList ? (
          <p className="p-4 text-sm text-slate-500">Loading inbox…</p>
        ) : (
          <ConversationList
            rows={rows}
            selectedId={selectedId}
            onSelect={(id) => setSelectedId(id)}
          />
        )}
      </aside>
      <section className="flex min-h-[50vh] min-w-0 flex-1 flex-col border-t border-white/10 md:border-l md:border-t-0">
        {loadingThread && selectedId ? (
          <p className="p-4 text-sm text-slate-500">Loading thread…</p>
        ) : (
          <ConversationThread
            viewerId={viewerId}
            detail={detail}
            messages={messages}
            canSend={canSend}
            composerAppendDraft={composerAppendDraft}
            composerExtras={
              <>
                {showAiSuggestions ? (
                  <AutopilotChatBar
                    conversationId={selectedId}
                    enabled={showAiSuggestions}
                    onInsertDraft={(text) =>
                      setComposerAppendDraft({ nonce: Date.now(), text })
                    }
                  />
                ) : null}
                {showAiSuggestions && selectedId && canSend ? (
                  <AiSuggestReplyBar
                    conversationId={selectedId}
                    onApply={(text) =>
                      setComposerAppendDraft({ nonce: Date.now(), text })
                    }
                  />
                ) : null}
              </>
            }
            phase2CallUrl={phase2CallUrl}
            onSendVoice={canSend ? sendVoiceBody : undefined}
            onSend={async (body) => {
              await sendMessageBody(body);
            }}
            onMarkRead={async () => {
              if (!selectedId) return;
              await fetch(`/api/conversations/${encodeURIComponent(selectedId)}/read`, {
                method: "POST",
                credentials: "same-origin",
              }).catch(() => {});
              void loadList();
            }}
          />
        )}
      </section>

      <ConversationInsightsPanel conversationId={selectedId} enabled={showBrokerInsights} />

      <ContentLicenseModal
        open={licenseOpen}
        requiredVersion={licenseVersion}
        onClose={() => {
          setLicenseOpen(false);
          pendingSendRef.current = null;
        }}
        onAccepted={() => {
          const body = pendingSendRef.current;
          pendingSendRef.current = null;
          if (body && selectedId) {
            void sendMessageBody(body).catch(() => {});
          }
        }}
      />
    </div>
  );
}
