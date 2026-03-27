"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ConversationList } from "@/components/messaging/ConversationList";
import { ConversationThread, type ThreadDetail, type ThreadMessage } from "@/components/messaging/ConversationThread";
import type { InboxConversationRow } from "@/modules/messaging/services/get-user-conversations";
import { ContentLicenseModal } from "@/components/legal/ContentLicenseModal";
import { CONTENT_LICENSE_ERROR, ContentLicenseRequiredError } from "@/lib/legal/content-license-client";
import { CONTENT_LICENSE_VERSION } from "@/modules/legal/content-license";

type Props = {
  viewerId: string;
};

export function MessagesPageClient({ viewerId }: Props) {
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

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col md:flex-row">
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
            onSend={async (body) => {
              if (!selectedId) return;
              const res = await fetch(`/api/conversations/${encodeURIComponent(selectedId)}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "same-origin",
                body: JSON.stringify({ body }),
              });
              const j = (await res.json()) as { error?: string };
              if (!res.ok) throw new Error(j.error ?? "Send failed");
              await loadThread(selectedId);
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
