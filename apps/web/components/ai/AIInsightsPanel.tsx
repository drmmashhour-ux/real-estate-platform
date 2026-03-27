"use client";

import { useState } from "react";

type Props = {
  listingId: string;
};

type ListingInsight = {
  trustScore: number | null;
  dealScore: number | null;
  riskLevel: "low" | "medium" | "high";
  recommendations: string[];
  explanations: string[];
};

export function AIInsightsPanel({ listingId }: Props) {
  const [data, setData] = useState<ListingInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error ?? "Analysis failed");
      setData(j as ListingInsight);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900/40">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">AI Insights</h3>
        <button
          onClick={run}
          disabled={loading}
          className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-[#C9A646] dark:text-black"
        >
          {loading ? "Analyzing..." : "Run AI analysis"}
        </button>
      </div>
      {error ? <p className="mt-3 text-sm text-rose-500">{error}</p> : null}
      {data ? (
        <div className="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-300">
          <p>
            Risk level: <strong>{data.riskLevel}</strong> · Trust: <strong>{data.trustScore ?? "—"}</strong> · Deal:{" "}
            <strong>{data.dealScore ?? "—"}</strong>
          </p>
          <ul className="list-disc space-y-1 pl-5">
            {data.recommendations.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-500">Deterministic hybrid insights using trust + deal + listing status data.</p>
      )}
    </section>
  );
}
