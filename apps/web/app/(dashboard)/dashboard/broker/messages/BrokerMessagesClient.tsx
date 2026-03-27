"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ContentLicenseModal } from "@/components/legal/ContentLicenseModal";
import { CONTENT_LICENSE_ERROR } from "@/lib/legal/content-license-client";
import { CONTENT_LICENSE_VERSION } from "@/modules/legal/content-license";

type Broker = { id: string; name: string | null; email: string };
type Conversation = {
  id: string;
  broker1Id: string;
  broker2Id: string;
  broker1: Broker;
  broker2: Broker;
  messages: { id: string; body: string; senderId: string; createdAt: string; sender: Broker }[];
};
type Message = { id: string; body: string; senderId: string; createdAt: string; sender: Broker };

export function BrokerMessagesClient() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [otherBrokerId, setOtherBrokerId] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [licenseOpen, setLicenseOpen] = useState(false);
  const [licenseVersion, setLicenseVersion] = useState<string>(CONTENT_LICENSE_VERSION);
  const pendingMessageRef = useRef<string | null>(null);

  const fetchConversations = useCallback(() => {
    fetch("/api/broker/conversations", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((data) => setConversations(Array.isArray(data) ? data : []))
      .catch(() => setConversations([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchConversations();
    });
  }, [fetchConversations]);

  useEffect(() => {
    if (!selectedId) {
      queueMicrotask(() => setMessages([]));
      return;
    }
    queueMicrotask(() => {
      void fetch(`/api/broker/conversations/${selectedId}/messages`, { credentials: "same-origin" })
        .then((r) => r.json())
        .then((data) => setMessages(Array.isArray(data) ? data : []))
        .catch(() => setMessages([]));
    });
  }, [selectedId]);

  function startConversation(e: React.FormEvent) {
    e.preventDefault();
    if (!otherBrokerId.trim()) return;
    setSending(true);
    fetch("/api/broker/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ otherBrokerId: otherBrokerId.trim() }),
      credentials: "same-origin",
    })
      .then((r) => r.json())
      .then((conv) => {
        if (conv.id) {
          setConversations((prev) => [conv, ...prev]);
          setSelectedId(conv.id);
          setMessages([]);
          setOtherBrokerId("");
        }
      })
      .finally(() => setSending(false));
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId || !newMessage.trim()) return;
    const text = newMessage.trim();
    setSending(true);
    try {
      const r = await fetch(`/api/broker/conversations/${selectedId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
        credentials: "same-origin",
      });
      const msg = (await r.json()) as { id?: string; error?: string; requiredVersion?: string };
      if (!r.ok) {
        if (msg.error === CONTENT_LICENSE_ERROR && msg.requiredVersion) {
          pendingMessageRef.current = text;
          setLicenseVersion(msg.requiredVersion);
          setLicenseOpen(true);
          return;
        }
        return;
      }
      if (msg.id) setMessages((prev) => [...prev, msg as Message]);
      setNewMessage("");
    } finally {
      setSending(false);
    }
  }

  const selected = conversations.find((c) => c.id === selectedId);
  const otherBroker = selected
    ? (selected.broker1Id > selected.broker2Id ? selected.broker1 : selected.broker2)
    : null;

  if (loading) {
    return <p className="text-sm text-slate-400">Loading conversations…</p>;
  }

  return (
    <>
    <div className="flex gap-4">
      <div className="w-72 shrink-0 space-y-2">
        <form onSubmit={startConversation} className="flex gap-2">
          <input
            type="text"
            value={otherBrokerId}
            onChange={(e) => setOtherBrokerId(e.target.value)}
            placeholder="Broker user ID"
            className="flex-1 rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
          />
          <button
            type="submit"
            disabled={sending}
            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            Start chat
          </button>
        </form>
        <p className="text-xs text-slate-500">Enter the other broker&apos;s user ID to start a conversation.</p>
        <ul className="mt-4 space-y-1">
          {conversations.map((c) => {
            const other = c.broker1.id > c.broker2.id ? c.broker1 : c.broker2;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(c.id)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                    selectedId === c.id ? "bg-emerald-500/20 text-emerald-300" : "text-slate-300 hover:bg-white/5"
                  }`}
                >
                  {other.name ?? other.email}
                </button>
              </li>
            );
          })}
          {conversations.length === 0 && (
            <li className="py-4 text-center text-sm text-slate-500">No conversations yet.</li>
          )}
        </ul>
      </div>
      <div className="min-w-0 flex-1 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col">
        {!selected ? (
          <div className="flex flex-1 items-center justify-center p-8 text-slate-500">
            Select a conversation or start a new chat.
          </div>
        ) : (
          <>
            <div className="border-b border-slate-800 px-4 py-2 text-sm font-medium text-slate-200">
              {otherBroker?.name ?? otherBroker?.email ?? "Broker"}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className="rounded-lg bg-white/5 px-3 py-2 text-sm text-slate-200"
                >
                  <span className="text-xs text-slate-500">{m.sender.name ?? m.sender.email}</span>
                  <p className="mt-0.5">{m.body}</p>
                  <p className="mt-1 text-[10px] text-slate-500">
                    {new Date(m.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
              {messages.length === 0 && (
                <p className="text-center text-sm text-slate-500">No messages yet. Send one below.</p>
              )}
            </div>
            <form onSubmit={sendMessage} className="flex gap-2 border-t border-slate-800 p-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
              />
              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </>
        )}
      </div>
    </div>
    <ContentLicenseModal
      open={licenseOpen}
      requiredVersion={licenseVersion}
      onClose={() => {
        setLicenseOpen(false);
        pendingMessageRef.current = null;
      }}
      onAccepted={() => {
        const text = pendingMessageRef.current;
        pendingMessageRef.current = null;
        const id = selectedId;
        if (!text || !id) return;
        setSending(true);
        void fetch(`/api/broker/conversations/${id}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: text }),
          credentials: "same-origin",
        })
          .then((r) => r.json())
          .then((msg: { id?: string }) => {
            if (msg.id) {
              setMessages((prev) => [...prev, msg as Message]);
              setNewMessage("");
            }
          })
          .finally(() => setSending(false));
      }}
    />
    </>
  );
}
