"use client";

import { useCallback, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/I18nContext";

const GOLD = "#D4AF37";
const BLACK = "#0b0b0b";

export type ChatMsg = { role: "user" | "assistant"; content: string };

export function AIChatWindow({
  context,
  agentKey,
  className = "",
}: {
  context: { listingId?: string; bookingId?: string; role?: string; surface?: string };
  agentKey?: string;
  className?: string;
}) {
  const { locale, t } = useI18n();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setError(null);
    setMessages((m) => [...m, { role: "user", content: text }]);
    setLoading(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lecipmManager: true,
          message: text,
          conversationId,
          uiLocale: locale,
          context: { ...context, uiLocale: locale },
          ...(agentKey ? { agentKey } : {}),
        }),
      });
      const data = (await res.json()) as { reply?: string; error?: string; conversationId?: string };
      if (!res.ok) throw new Error(data.error || "Request failed");
      setConversationId(data.conversationId ?? conversationId);
      setMessages((m) => [...m, { role: "assistant", content: data.reply ?? "" }]);
      queueMicrotask(() => endRef.current?.scrollIntoView({ behavior: "smooth" }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
      setMessages((m) => [...m, { role: "assistant", content: t("errors.generic") }]);
    } finally {
      setLoading(false);
    }
  }, [agentKey, context, conversationId, input, loading, locale, t]);

  return (
    <div className={`flex flex-col rounded-xl border border-white/10 ${className}`} style={{ backgroundColor: "#141414" }}>
      <div className="max-h-72 min-h-[180px] space-y-3 overflow-y-auto p-4 text-sm">
        {messages.length === 0 ? (
          <p className="text-white/45">{t("ai.chatEmptyState")}</p>
        ) : null}
        {messages.map((m, i) => (
          <div
            key={`${i}-${m.role}`}
            className={`rounded-lg px-3 py-2 ${m.role === "user" ? "ml-6 bg-white/5 text-white" : "mr-6 text-white/85"}`}
            style={m.role === "assistant" ? { borderLeft: `3px solid ${GOLD}` } : undefined}
          >
            {m.content}
          </div>
        ))}
        {loading ? <p className="text-xs text-white/40">{t("ai.chatThinking")}</p> : null}
        {error ? <p className="text-xs text-red-400">{error}</p> : null}
        <div ref={endRef} />
      </div>
      <div className="flex gap-2 border-t border-white/10 p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), void send())}
          placeholder={t("ai.chatInputPlaceholder")}
          className="min-w-0 flex-1 rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-sm text-white placeholder:text-white/35"
        />
        <button
          type="button"
          onClick={() => void send()}
          disabled={loading}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-black disabled:opacity-40"
          style={{ backgroundColor: GOLD }}
        >
          {t("ai.chatSend")}
        </button>
      </div>
    </div>
  );
}
