"use client";

import { useCallback, useEffect, useState } from "react";

export type DealAssistantPayload = {
  detectedIntent: string;
  detectedObjection: string;
  urgencyLevel: string;
  recommendedAction: string;
  messageSuggestion: string;
  confidence: number;
  insightId?: string | null;
  messageCount?: number;
};

type Props = {
  conversationId: string | null;
  onApplySuggestion: (text: string) => void;
};

const ACTION_LABELS: Record<string, string> = {
  send_message: "Send message (use draft below)",
  push_booking: "Push booking / visit",
  assign_broker: "Assign broker",
  wait: "Wait / observe",
};

export function DealAssistantPanel({ conversationId, onApplySuggestion }: Props) {
  const [data, setData] = useState<DealAssistantPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [persisted, setPersisted] = useState(false);

  const run = useCallback(
    async (save: boolean) => {
      if (!conversationId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/ai-inbox/conversations/${conversationId}/deal-assistant`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ persist: save }),
        });
        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(j.error ?? `HTTP ${res.status}`);
        }
        const payload = (await res.json()) as DealAssistantPayload;
        setData(payload);
        if (save && payload.insightId) setPersisted(true);
      } catch (e) {
        setData(null);
        setError(e instanceof Error ? e.message : "Analysis failed");
      } finally {
        setLoading(false);
      }
    },
    [conversationId]
  );

  useEffect(() => {
    setData(null);
    setError(null);
    setPersisted(false);
    if (!conversationId) return;
    void run(false);
  }, [conversationId, run]);

  if (!conversationId) {
    return (
      <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-4 text-sm text-slate-500">
        Select a thread to open the Deal Assistant.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-violet-900/40 bg-violet-950/20 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-violet-900/30 pb-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-violet-300/90">Deal Assistant</p>
          <p className="text-[11px] text-slate-500">Assisted AI — you review and send.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => void run(false)}
            className="rounded-lg border border-violet-800/60 px-3 py-1.5 text-xs text-violet-100 hover:bg-violet-950/50 disabled:opacity-50"
          >
            Refresh
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => void run(true)}
            className="rounded-lg bg-violet-600/80 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-500 disabled:opacity-50"
          >
            Save insight
          </button>
        </div>
      </div>

      {error ? <p className="mt-3 text-xs text-rose-400">{error}</p> : null}
      {loading && !data ? <p className="mt-3 text-xs text-slate-500">Analyzing conversation…</p> : null}

      {data ? (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap gap-2 text-[11px]">
            <span className="rounded-full border border-slate-600 bg-slate-900/60 px-2 py-0.5 text-slate-200">
              Intent: <strong className="font-medium text-violet-200">{data.detectedIntent}</strong>
            </span>
            <span className="rounded-full border border-slate-600 bg-slate-900/60 px-2 py-0.5 text-slate-200">
              Objection: <strong className="font-medium text-amber-200/90">{data.detectedObjection}</strong>
            </span>
            <span className="rounded-full border border-slate-600 bg-slate-900/60 px-2 py-0.5 text-slate-200">
              Urgency: <strong className="font-medium text-rose-200/90">{data.urgencyLevel}</strong>
            </span>
            <span className="rounded-full border border-slate-600 bg-slate-900/60 px-2 py-0.5 text-slate-400">
              Confidence {(data.confidence * 100).toFixed(0)}%
            </span>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Suggested message</p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{data.messageSuggestion}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onApplySuggestion(data.messageSuggestion)}
              className="rounded-lg bg-amber-500/90 px-3 py-2 text-xs font-medium text-slate-950 hover:bg-amber-400"
            >
              Copy to reply box
            </button>
            <button
              type="button"
              onClick={() =>
                onApplySuggestion(
                  `${data.messageSuggestion}\n\nWould you like me to suggest a few times for a quick visit or call?`
                )
              }
              className="rounded-lg border border-emerald-800/60 px-3 py-2 text-xs text-emerald-200/90 hover:bg-emerald-950/30"
            >
              + Booking nudge
            </button>
            <button
              type="button"
              onClick={() =>
                onApplySuggestion(
                  "I’d like to loop in one of our licensed brokers to make sure you get a clear, professional answer. Is it okay if I connect you?"
                )
              }
              className="rounded-lg border border-sky-800/60 px-3 py-2 text-xs text-sky-200/90 hover:bg-sky-950/30"
            >
              Broker handoff script
            </button>
            <span className="self-center text-[10px] text-slate-600">
              Next: {ACTION_LABELS[data.recommendedAction] ?? data.recommendedAction}
            </span>
          </div>

          {persisted ? <p className="text-[10px] text-emerald-500/90">Insight saved to deal_assistant_insights.</p> : null}
        </div>
      ) : null}
    </div>
  );
}
