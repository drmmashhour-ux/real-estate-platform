"use client";

import { useCallback, useState } from "react";
import { Loader2, Send, Sparkles } from "lucide-react";

export function ExploreMapGeminiPanel() {
  const [input, setInput] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const send = useCallback(async () => {
    const message = input.trim();
    if (!message || loading) return;
    setLoading(true);
    setError(null);
    setReply(null);
    try {
      const res = await fetch("/api/explore/map-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = (await res.json()) as { ok?: boolean; text?: string; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Request failed.");
        return;
      }
      setReply(data.text ?? "");
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }, [input, loading]);

  return (
    <div className="rounded-2xl border border-premium-gold/25 bg-[#141414] p-4 shadow-inner">
      <div className="flex items-center gap-2 text-premium-gold">
        <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
        <p className="text-xs font-bold uppercase tracking-[0.18em]">Gemini assistant</p>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-white/65">
        Ask about neighborhoods, using the map, or refining your search — not legal or mortgage advice.
      </p>
      <div className="mt-3 flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. Is Verdun good for first-time buyers near métro?"
          rows={2}
          className="min-h-[44px] flex-1 resize-y rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-premium-gold/50 focus:outline-none"
          maxLength={4000}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
        />
        <button
          type="button"
          onClick={() => void send()}
          disabled={loading || !input.trim()}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-premium-gold text-black transition hover:brightness-110 disabled:opacity-40"
          aria-label="Send"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        </button>
      </div>
      {error ? (
        <p className="mt-3 text-xs text-amber-200/90">{error}</p>
      ) : null}
      {reply ? (
        <div className="mt-3 max-h-48 overflow-y-auto rounded-lg border border-white/10 bg-black/30 p-3 text-sm leading-relaxed text-white/85 whitespace-pre-wrap">
          {reply}
        </div>
      ) : null}
    </div>
  );
}
