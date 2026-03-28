"use client";

import { useCallback, useState } from "react";
import type { ListingContext, WriterAction, WriterType } from "@/lib/ai/writer";

type Props = {
  value: string;
  onChange: (next: string) => void;
  type: WriterType;
  /** For listing "generate" — property facts from the form */
  listingContext?: ListingContext | null;
  /** Show full description generator (listing type only) */
  showDescriptionGenerator?: boolean;
  className?: string;
};

export function AiWriterToolbar({
  value,
  onChange,
  type,
  listingContext,
  showDescriptionGenerator = true,
  className = "",
}: Props) {
  const [loading, setLoading] = useState<WriterAction | "improve" | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  const run = useCallback(
    async (action: WriterAction) => {
      setErr(null);
      setHint(null);
      setLoading(action);
      try {
        const res = await fetch("/api/ai/write", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: value,
            type,
            action,
            listingContext: type === "listing" && action === "generate" ? listingContext : undefined,
          }),
        });
        const j = (await res.json().catch(() => ({}))) as {
          error?: string;
          text?: string;
          offline?: boolean;
          offlineHint?: string;
        };
        if (!res.ok) throw new Error(j.error ?? "Request failed");
        if (typeof j.text !== "string") {
          setErr("AI writer returned no text. Try again.");
          return;
        }
        onChange(j.text);
        if (j.offline && typeof j.offlineHint === "string") setHint(j.offlineHint);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Error");
      } finally {
        setLoading(null);
      }
    },
    [value, type, listingContext, onChange]
  );

  const btn =
    "rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition disabled:opacity-45 disabled:pointer-events-none";
  const gold = "border-premium-gold/50 bg-premium-gold/10 text-premium-gold hover:bg-premium-gold/20";
  const subtle = "border-white/15 bg-black/30 text-[#B3B3B3] hover:border-premium-gold/35 hover:text-white";

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 inline-flex items-center gap-1 rounded-md border border-premium-gold/35 bg-[#0B0B0B] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-premium-gold">
          <span aria-hidden>✨</span> AI
        </span>
        {type === "listing" && showDescriptionGenerator ? (
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => void run("generate")}
            className={`${btn} border-premium-gold bg-premium-gold text-black hover:brightness-110`}
          >
            {loading === "generate" ? "Generating…" : "✨ Generate description"}
          </button>
        ) : null}
        {type === "message" ? (
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => void run("professional")}
            className={`${btn} ${gold}`}
          >
            {loading === "professional" ? "Generating…" : "✨ Improve message"}
          </button>
        ) : (
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => void run("professional")}
            className={`${btn} ${gold}`}
          >
            {loading === "professional" ? "…" : "Make it professional"}
          </button>
        )}
        <button type="button" disabled={loading !== null} onClick={() => void run("shorter")} className={`${btn} ${subtle}`}>
          {loading === "shorter" ? "…" : "Make it shorter"}
        </button>
        <button type="button" disabled={loading !== null} onClick={() => void run("persuasive")} className={`${btn} ${subtle}`}>
          {loading === "persuasive" ? "…" : "More persuasive"}
        </button>
        <button type="button" disabled={loading !== null} onClick={() => void run("translate_fr")} className={`${btn} ${subtle}`}>
          {loading === "translate_fr" ? "…" : "Translate to French"}
        </button>
        <button type="button" disabled={loading !== null} onClick={() => void run("translate_en")} className={`${btn} ${subtle}`}>
          {loading === "translate_en" ? "…" : "Translate to English"}
        </button>
        {type === "mortgage" ? (
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => void run("generate")}
            className={`${btn} ${gold}`}
          >
            {loading === "generate" ? "…" : "Explain options simply"}
          </button>
        ) : null}
      </div>
      {loading ? (
        <p className="flex items-center gap-2 text-[11px] text-premium-gold">
          <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-premium-gold border-t-transparent" />
          Generating…
        </p>
      ) : null}
      {err ? <p className="text-[11px] text-red-400">{err}</p> : null}
      {hint ? <p className="text-[11px] text-premium-gold/90">{hint}</p> : null}
    </div>
  );
}
