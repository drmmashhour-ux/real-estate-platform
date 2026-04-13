"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

type Props = {
  disputeId: string;
  initialAiRecommendation: string | null;
  initialAiSummary: string | null;
};

export function BnhubDisputeDetailClient({ disputeId, initialAiRecommendation, initialAiSummary }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rec, setRec] = useState(initialAiRecommendation);
  const [summary, setSummary] = useState(initialAiSummary);

  const runAi = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/bnhub/disputes/${disputeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "run_ai_assistant" }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        recommendation?: string;
        summary?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Request failed");
        return;
      }
      setRec(data.recommendation ?? null);
      setSummary(data.summary ?? null);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [disputeId, router]);

  return (
    <div className="mt-6 rounded-2xl border border-premium-gold/25 bg-black/30 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-premium-gold">AI dispute assistant</h2>
        <button
          type="button"
          onClick={() => void runAi()}
          disabled={loading}
          className="rounded-lg bg-premium-gold px-4 py-2 text-xs font-bold text-black disabled:opacity-50"
        >
          {loading ? "Analyzing…" : "Run analysis"}
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Suggestion only — not legal or financial advice. Uses booking messages, checklist, and dispute thread when available.
      </p>
      {error ? <p className="mt-2 text-xs text-red-400">{error}</p> : null}
      <div className="mt-4 space-y-2 text-sm">
        <p>
          <span className="text-slate-500">Recommendation:</span>{" "}
          <span className="font-semibold text-white">{rec ?? "—"}</span>
        </p>
        {summary ? <p className="text-slate-300 whitespace-pre-wrap">{summary}</p> : null}
      </div>
    </div>
  );
}
