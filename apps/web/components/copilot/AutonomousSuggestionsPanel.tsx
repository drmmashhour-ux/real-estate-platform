"use client";

import { useCallback, useEffect, useState } from "react";

export type ProactiveSuggestionRow = {
  id: string;
  suggestionType: string;
  priority: string;
  title: string;
  message: string;
  workflowType: string | null;
  accepted: boolean;
  dismissed: boolean;
};

type Props = {
  /** e.g. solo_broker | investor */
  ownerType?: string;
  /** When true, run pattern→AI generation before listing (can create new rows). */
  autoGenerate?: boolean;
  className?: string;
};

export function AutonomousSuggestionsPanel({
  ownerType = "solo_broker",
  autoGenerate = false,
  className = "",
}: Props) {
  const [items, setItems] = useState<ProactiveSuggestionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    const data = await fetch("/api/suggestions/list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerType }),
      credentials: "include",
    }).then((r) => r.json());
    if (!data.success) {
      setError(data.error ?? "List failed");
      setItems([]);
      return;
    }
    setItems((data.items ?? []) as ProactiveSuggestionRow[]);
    setError(null);
  }, [ownerType]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      if (autoGenerate) {
        const gen = await fetch("/api/suggestions/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ownerType }),
          credentials: "include",
        }).then((r) => r.json());
        if (!gen.success) {
          setError(gen.error ?? "Generate failed");
        } else if (Array.isArray(gen.items) && gen.items.length === 0) {
          setInfo("No new suggestions yet — use the product (searches, deals, portfolio) to build signals, then refresh.");
        }
      }
      await loadList();
    } finally {
      setLoading(false);
    }
  }, [autoGenerate, loadList, ownerType]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function accept(id: string) {
    await fetch("/api/suggestions/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suggestionId: id, launchWorkflow: true }),
      credentials: "include",
    });
    await loadList();
  }

  async function dismiss(id: string) {
    await fetch("/api/suggestions/dismiss", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suggestionId: id }),
      credentials: "include",
    });
    await loadList();
  }

  return (
    <div
      className={`rounded-2xl border border-white/10 bg-black p-5 text-white space-y-4 ${className}`.trim()}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xl font-semibold text-[#D4AF37]">Proactive AI suggestions</div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading}
          className="rounded-lg border border-[#D4AF37]/40 px-3 py-1 text-xs font-medium text-[#D4AF37] disabled:opacity-50"
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>
      <p className="text-xs text-white/50">
        Based on your recent behavior signals. Suggestions are advisory; accepting may open a proposed workflow that
        still requires your approval — nothing executes automatically.
      </p>

      {error ? <div className="rounded-lg border border-red-500/30 bg-red-950/30 px-3 py-2 text-sm text-red-200">{error}</div> : null}
      {info ? <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70">{info}</div> : null}

      {items.length === 0 && !loading && !error ? (
        <p className="text-sm text-white/45">No open suggestions. Interact with listings, deals, or portfolio, then tap Refresh.</p>
      ) : null}

      {items.map((item) => (
        <div key={item.id} className="rounded-xl border border-white/10 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="font-semibold text-[#D4AF37]">{item.title}</div>
            <div className="text-xs uppercase text-white/60">{item.priority}</div>
          </div>
          <div className="text-xs text-white/40">{item.suggestionType}</div>
          <div className="text-sm text-white/70">{item.message}</div>
          {item.workflowType ? (
            <div className="text-xs text-white/45">Proposed workflow: {item.workflowType}</div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void accept(item.id)}
              className="rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-black"
            >
              Accept
            </button>
            <button
              type="button"
              onClick={() => void dismiss(item.id)}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm"
            >
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default AutonomousSuggestionsPanel;
