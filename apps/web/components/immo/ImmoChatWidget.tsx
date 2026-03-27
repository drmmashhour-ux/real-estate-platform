"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

const GOLD = "#C9A646";
const STORAGE_KEY = "lecipm_immo_guest_session";

function getOrCreateGuestId(): string {
  try {
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id || id.length < 8) {
      id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `g-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
      localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    return `g-${Date.now()}`;
  }
}

type ChatMessage = { id?: string; sender: string; content: string; createdAt?: string };

export function ImmoChatWidget() {
  const [open, setOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [guestId, setGuestId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setGuestId(getOrCreateGuestId());
  }, []);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      const el = listRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  };

  const fetchMessages = useCallback(
    async (cid: string) => {
      if (!guestId) return;
      const res = await fetch(`/api/immo/conversations/${cid}`, {
        headers: { "x-immo-guest-id": guestId },
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        messages: { id: string; sender: string; content: string; createdAt: string }[];
      };
      setMessages(
        data.messages.map((m) => ({
          id: m.id,
          sender: m.sender,
          content: m.content,
          createdAt: m.createdAt,
        }))
      );
      scrollToBottom();
    },
    [guestId]
  );

  useEffect(() => {
    if (!open || !conversationId || !guestId) {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }
    void fetchMessages(conversationId);
    pollRef.current = setInterval(() => {
      void fetchMessages(conversationId);
    }, 4500);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [open, conversationId, guestId, fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, open]);

  async function send(text?: string) {
    const t = (text ?? input).trim();
    if (!t || loading) return;
    let gid = guestId;
    if (!gid) {
      gid = getOrCreateGuestId();
      setGuestId(gid);
    }
    setLoading(true);
    setInput("");
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          crm: true,
          message: t,
          conversationId: conversationId ?? null,
          guestSessionId: gid,
        }),
      });
      const data = (await res.json()) as {
        reply?: string;
        conversationId?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Failed");
      if (data.conversationId) setConversationId(data.conversationId);
      setMessages((prev) => [
        ...prev,
        { sender: "user", content: t },
        { sender: "ai", content: data.reply ?? "…" },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { sender: "user", content: t },
        { sender: "ai", content: "Something went wrong. Please try again in a moment." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-label="Open chat"
        onClick={() => setOpen((o) => !o)}
        className="pointer-events-auto fixed bottom-6 left-4 z-50 flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#C9A646]/50 bg-[#121212] text-xl shadow-[0_12px_40px_rgba(201, 166, 70,0.25)] transition hover:scale-105 hover:border-[#C9A646] md:bottom-8 md:left-8"
        style={{ color: GOLD }}
      >
        💬
      </button>

      <div
        className={`fixed bottom-24 left-4 z-50 flex w-[min(100vw-2rem,380px)] flex-col overflow-hidden rounded-2xl border border-[#C9A646]/35 bg-[#0B0B0B]/98 shadow-[0_24px_80px_rgba(0,0,0,0.65)] backdrop-blur-lg transition-all duration-300 md:bottom-28 md:left-8 ${
          open ? "pointer-events-auto max-h-[min(70vh,520px)] translate-y-0 opacity-100" : "pointer-events-none max-h-0 translate-y-4 opacity-0"
        }`}
      >
        <div
          className="flex items-center justify-between border-b border-white/10 px-4 py-3"
          style={{ background: `linear-gradient(90deg, rgba(11,11,11,0.95), rgba(201, 166, 70,0.08))` }}
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: GOLD }}>
              Immo AI
            </p>
            <p className="text-[11px] text-[#B3B3B3]">Buy · rent · mortgage · experts</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg px-2 py-1 text-sm text-[#B3B3B3] hover:bg-white/5 hover:text-white"
            aria-label="Close chat"
          >
            ✕
          </button>
        </div>

        <div className="flex gap-2 border-b border-white/10 px-3 py-2">
          <QuickChip label="Expert" onClick={() => void send("I'd like to talk to an expert.")} />
          <QuickChip label="Mortgage" onClick={() => void send("I need mortgage help.")} />
          <Link
            href="/search/bnhub"
            className="rounded-full border border-[#C9A646]/35 bg-[#121212] px-2.5 py-1 text-[10px] font-semibold text-[#C9A646] hover:bg-[#C9A646]/10"
          >
            Listings
          </Link>
        </div>

        <div ref={listRef} className="min-h-[220px] flex-1 space-y-3 overflow-y-auto px-3 py-3">
          {messages.length === 0 ? (
            <p className="text-center text-xs text-[#B3B3B3]">
              Hi! Ask about Montreal / Laval / Québec — or use the quick actions above.
            </p>
          ) : null}
          {messages.map((m, i) => (
            <div
              key={`${m.createdAt ?? i}-${i}`}
              className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  m.sender === "user"
                    ? "rounded-br-md bg-[#C9A646] text-black"
                    : m.sender === "expert"
                      ? "rounded-bl-md border border-emerald-500/40 bg-emerald-500/10 text-emerald-100"
                      : "rounded-bl-md border border-white/10 bg-[#121212] text-[#E5E5E5]"
                }`}
              >
                {m.sender === "expert" ? (
                  <span className="mb-1 block text-[10px] font-semibold uppercase text-emerald-400">Expert</span>
                ) : null}
                {m.content}
              </div>
            </div>
          ))}
          {loading ? (
            <p className="text-center text-xs text-[#B3B3B3] animate-pulse">Thinking…</p>
          ) : null}
        </div>

        <div className="border-t border-white/10 p-3">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), void send())}
              placeholder="Type a message…"
              className="min-w-0 flex-1 rounded-xl border border-white/15 bg-[#121212] px-3 py-2.5 text-sm text-white placeholder:text-[#B3B3B3]/50 focus:border-[#C9A646]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A646]/20"
            />
            <button
              type="button"
              disabled={loading || !input.trim()}
              onClick={() => void send()}
              className="shrink-0 rounded-xl px-4 py-2 text-sm font-bold text-black disabled:opacity-40"
              style={{ background: GOLD }}
            >
              Send
            </button>
          </div>
          <p className="mt-2 text-[10px] text-[#737373]">
            Not licensed advice — we connect you with verified professionals.{" "}
            <Link href="/contact" className="underline hover:text-[#C9A646]">
              Contact
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}

function QuickChip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-white/15 bg-[#121212] px-2.5 py-1 text-[10px] font-medium text-[#E5E5E5] hover:border-[#C9A646]/40 hover:text-[#C9A646]"
    >
      {label}
    </button>
  );
}
