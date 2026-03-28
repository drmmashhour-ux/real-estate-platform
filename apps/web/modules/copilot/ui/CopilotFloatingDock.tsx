"use client";

import { useCallback, useState } from "react";
import type { CopilotResponse as CopilotResponseType } from "@/modules/copilot/domain/copilotTypes";
import { CopilotInput } from "@/modules/copilot/ui/CopilotInput";
import { CopilotResponseView } from "@/modules/copilot/ui/CopilotResponse";

type Props = {
  listingId?: string;
  watchlistId?: string;
  /** Show “Why not selling?” (signed-in owner on their listing). */
  showSellerQuick?: boolean;
};

function buildQuickActions(listingId: string | undefined, showSellerQuick: boolean) {
  const actions: { label: string; query: string }[] = [
    {
      label: "Analyze this property",
      query: listingId
        ? `Analyze listing ${listingId}`
        : "Find good deals under $500k in Montreal",
    },
    { label: "Find good deals", query: "Find good deals under $600k in Laval" },
    { label: "Portfolio changes", query: "What changed on my watchlist this week?" },
  ];
  if (showSellerQuick && listingId) {
    actions.unshift({ label: "Why not selling?", query: "Why is my listing not selling?" });
    actions.push({
      label: "Fix listing",
      query: "Improve listing trust and fix missing items for my listing",
    });
  }
  return actions;
}

/**
 * Bottom-right floating Copilot — input + spec quick actions.
 */
export function CopilotFloatingDock({ listingId, watchlistId, showSellerQuick = false }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<CopilotResponseType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const quick = buildQuickActions(listingId, showSellerQuick);

  const sendWith = useCallback(
    async (raw: string) => {
      const q = raw.trim();
      if (!q) return;
      setQuery(q);
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/copilot", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: q,
            listingId: listingId ?? undefined,
            watchlistId: watchlistId ?? undefined,
          }),
        });
        const j = (await res.json()) as { response?: CopilotResponseType; error?: string };
        if (!res.ok) {
          setResponse(null);
          setError(j.error ?? "Request failed");
          return;
        }
        setResponse(j.response ?? null);
      } catch {
        setError("Network error");
        setResponse(null);
      } finally {
        setLoading(false);
      }
    },
    [listingId, watchlistId],
  );

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col items-end gap-3">
      {open ? (
        <div className="pointer-events-auto w-[min(100vw-2rem,22rem)] max-h-[min(70vh,520px)] overflow-y-auto rounded-2xl border border-premium-gold/30 bg-[#0B0B0B]/95 p-4 shadow-[0_12px_48px_rgba(0,0,0,0.55)] backdrop-blur-md">
          <div className="mb-2 flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-premium-gold">Copilot</p>
              <p className="text-[11px] text-slate-500">Deterministic scores only.</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-white/10 hover:text-white"
              aria-label="Close Copilot"
            >
              ✕
            </button>
          </div>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {quick.map((a) => (
              <button
                key={a.label}
                type="button"
                onClick={() => void sendWith(a.query)}
                className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300 hover:border-premium-gold/35"
              >
                {a.label}
              </button>
            ))}
          </div>
          <CopilotInput
            value={query}
            onChange={setQuery}
            onSubmit={() => void sendWith(query)}
            disabled={loading}
            placeholder="Ask anything…"
          />
          <div className="mt-3 max-h-48 overflow-y-auto">
            <CopilotResponseView response={response} error={error} loading={loading} />
          </div>
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full border border-premium-gold/40 bg-premium-gold text-lg font-bold text-[#0B0B0B] shadow-[0_8px_32px_rgb(var(--premium-gold-channels) / 0.45)] transition hover:scale-[1.03] hover:bg-premium-gold"
        aria-expanded={open}
        aria-label={open ? "Close Copilot" : "Open Copilot"}
      >
        ✦
      </button>
    </div>
  );
}
