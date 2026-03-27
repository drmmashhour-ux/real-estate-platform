"use client";

import { useCallback, useState } from "react";
import type { CopilotResponse as CopilotResponseType } from "@/modules/copilot/domain/copilotTypes";
import { CopilotInput } from "@/modules/copilot/ui/CopilotInput";
import { CopilotResponseView } from "@/modules/copilot/ui/CopilotResponse";

const QUICK = [
  "Find deals under $600k in Laval",
  "Portfolio summary",
  "Why is my listing not selling?",
];

type Props = {
  /** When embedded on a listing page, pass id for seller/pricing intents. */
  listingId?: string;
  watchlistId?: string;
};

export function CopilotPanel({ listingId, watchlistId }: Props) {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<CopilotResponseType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  const send = useCallback(() => {
    void sendWith(query);
  }, [query, sendWith]);

  return (
    <section className="rounded-2xl border border-[#C9A646]/25 bg-slate-950/60 p-5">
      <div className="mb-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#C9A646]">LECIPM Copilot</p>
        <p className="mt-1 text-xs text-slate-500">
          Suggestions from your data — deterministic scores only. Not legal, tax, or lending advice.
        </p>
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        {QUICK.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => void sendWith(q)}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400 hover:border-[#C9A646]/30 hover:text-slate-200"
          >
            {q}
          </button>
        ))}
      </div>
      <CopilotInput value={query} onChange={setQuery} onSubmit={() => void send()} disabled={loading} />
      <div className="mt-4">
        <CopilotResponseView response={response} error={error} loading={loading} />
      </div>
    </section>
  );
}
