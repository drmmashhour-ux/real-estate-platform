"use client";

import { useCallback, useEffect, useState } from "react";

type Nba = {
  action: string;
  priority: "high" | "medium" | "low";
  rationale: string[];
  suggestedMessage?: string;
};

type Sug = { message: string; tone: string; goal: string };

type Ins = {
  headline: string;
  dealStatus: string;
  objections: string[];
  voice?: { speakingSpeed?: number; confidence?: string; urgency?: string } | null;
};

const PRI: Record<"high" | "medium" | "low", string> = {
  high: "bg-rose-500/20 text-rose-200 border-rose-500/30",
  medium: "bg-amber-500/15 text-amber-200 border-amber-500/25",
  low: "bg-slate-500/15 text-slate-200 border-slate-500/25",
};

type Props = {
  conversationId: string | null;
  enabled: boolean;
  onSuggestionText?: (text: string | null) => void;
  onUseSuggestionInComposer: () => void;
};

export function ConversationAssistantPanel({
  conversationId,
  enabled,
  onSuggestionText,
  onUseSuggestionInComposer,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [nextBest, setNextBest] = useState<Nba | null>(null);
  const [suggested, setSuggested] = useState<Sug | null>(null);
  const [ins, setIns] = useState<Ins | null>(null);
  const [copyDone, setCopyDone] = useState(false);
  const [degraded, setDegraded] = useState(false);

  const load = useCallback(async () => {
    if (!conversationId || !enabled) {
      setNextBest(null);
      setSuggested(null);
      setIns(null);
      onSuggestionText?.(null);
      return;
    }
    setLoading(true);
    setErr(null);
    setDegraded(false);
    try {
      const res = await fetch(`/api/conversations/${encodeURIComponent(conversationId)}/assistant`, {
        credentials: "same-origin",
      });
      const j = (await res.json()) as {
        nextBestAction?: Nba;
        suggestedMessage?: Sug;
        insightsSummary?: Ins;
        error?: string;
        warning?: string;
      };
      if (!res.ok) {
        setErr(j.error ?? "Could not load assistant");
        onSuggestionText?.(null);
        return;
      }
      if (j.nextBestAction) setNextBest(j.nextBestAction);
      if (j.suggestedMessage) {
        setSuggested(j.suggestedMessage);
        onSuggestionText?.(j.suggestedMessage.message || null);
      } else onSuggestionText?.(null);
      if (j.insightsSummary) setIns(j.insightsSummary);
      if (j.warning) setDegraded(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
      onSuggestionText?.(null);
    } finally {
      setLoading(false);
    }
  }, [conversationId, enabled, onSuggestionText]);

  useEffect(() => {
    void load();
  }, [load]);

  const copySug = useCallback(() => {
    if (!suggested?.message) return;
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      return;
    }
    void navigator.clipboard.writeText(suggested.message);
    setCopyDone(true);
    window.setTimeout(() => setCopyDone(false), 2000);
  }, [suggested?.message]);

  const post = useCallback(
    async (event: "suggestion_used" | "action_executed", extra: Record<string, string | null | undefined>) => {
      if (!conversationId) return;
      await fetch(`/api/conversations/${encodeURIComponent(conversationId)}/assistant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ event, ...extra }),
      }).catch(() => {});
    },
    [conversationId]
  );

  if (!enabled) return null;

  return (
    <div className="border-b border-white/5 bg-gradient-to-b from-slate-950/90 to-slate-950/40 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Conversation assistant</p>
      <p className="mt-0.5 text-xs leading-snug text-slate-500">
        Suggestions only — you choose what to send. Not legal or financial advice.
      </p>

      {!conversationId ? (
        <p className="mt-2 text-xs text-slate-500">Select a conversation.</p>
      ) : null}
      {loading ? <p className="mt-2 text-xs text-slate-500">Loading…</p> : null}
      {err ? <p className="mt-1 text-xs text-rose-400">{err}</p> : null}
      {degraded && !err ? <p className="mt-1 text-[10px] text-amber-200/80">Heuristics were reduced for this response.</p> : null}

      {nextBest ? (
        <section className="mt-3 space-y-2">
          <p className="text-[10px] font-semibold uppercase text-slate-500">Next best action</p>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase ${
                PRI[nextBest.priority] ?? PRI.low
              }`}
            >
              {nextBest.priority}
            </span>
            <span className="text-sm font-medium text-slate-100">{nextBest.action}</span>
          </div>
          {nextBest.rationale.length > 0 ? (
            <ul className="list-inside list-disc text-xs text-slate-400">
              {nextBest.rationale.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          ) : null}
          {nextBest.suggestedMessage ? (
            <p className="text-xs text-slate-500">
              <span className="text-slate-600">Preview:</span> {nextBest.suggestedMessage}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-md border border-white/15 bg-white/5 px-2 py-1 text-[10px] font-medium text-slate-200 hover:bg-white/10"
              onClick={() => void post("action_executed", { actionLabel: nextBest.action, messagePreview: null })}
            >
              Log next step
            </button>
          </div>
        </section>
      ) : null}

      {suggested && suggested.message ? (
        <section className="mt-4 space-y-2">
          <p className="text-[10px] font-semibold uppercase text-slate-500">Suggested message</p>
          <p className="rounded-lg border border-white/10 bg-black/30 p-2 text-sm text-slate-100 whitespace-pre-wrap">
            {suggested.message}
          </p>
          <p className="text-[10px] text-slate-500">
            Tone: {suggested.tone} · Goal: {suggested.goal}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copySug}
              className="rounded-md bg-slate-700/80 px-2 py-1.5 text-xs text-white hover:bg-slate-600"
            >
              {copyDone ? "Copied" : "Copy"}
            </button>
            <button
              type="button"
              onClick={onUseSuggestionInComposer}
              className="rounded-md border border-emerald-500/40 bg-emerald-900/30 px-2 py-1.5 text-xs font-medium text-emerald-100 hover:bg-emerald-900/50"
            >
              Use suggestion
            </button>
          </div>
        </section>
      ) : null}

      {ins ? (
        <section className="mt-4 space-y-2">
          <p className="text-[10px] font-semibold uppercase text-slate-500">Deal status (heuristic)</p>
          <p className="text-xs text-slate-200">{ins.dealStatus}</p>
          <p className="text-xs text-slate-400">{ins.headline}</p>
          {ins.voice && (ins.voice.urgency || ins.voice.confidence) ? (
            <p className="text-[10px] text-slate-500">
              Last voice: urgency ~{ins.voice.urgency ?? "n/a"}, confidence ~{ins.voice.confidence ?? "n/a"}{" "}
              {ins.voice.speakingSpeed != null ? `· pace ~${ins.voice.speakingSpeed} (rough)` : null}
            </p>
          ) : null}
          <p className="text-[10px] font-semibold uppercase text-slate-500">Objections (wording heuristics)</p>
          <ul className="list-inside list-disc text-xs text-slate-300">
            {ins.objections.map((o, i) => (
              <li key={i}>{o}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
