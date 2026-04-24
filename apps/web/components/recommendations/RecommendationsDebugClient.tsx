"use client";

import { useCallback, useEffect, useState } from "react";

type Outcome = { counts: Record<string, number>; ctr: number | null; windowDays: number };

export function RecommendationsDebugClient() {
  const [buyerJson, setBuyerJson] = useState<string>("");
  const [outcomes, setOutcomes] = useState<Outcome | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rec, track] = await Promise.all([
        fetch("/api/recommendations?mode=BUYER&limit=8&debug=1&personalization=1", { credentials: "include" }),
        fetch("/api/recommendations/outcomes-summary", { credentials: "include" }),
      ]);
      const rj = await rec.json();
      setBuyerJson(JSON.stringify(rj, null, 2));
      if (track.ok) {
        setOutcomes((await track.json()) as Outcome);
      } else {
        setOutcomes(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10 text-slate-100">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#D4AF37]/90">Admin</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Recommendations debug</h1>
        <p className="mt-2 text-sm text-slate-400">
          Internal factor breakdowns and profile summaries. End users only see plain-language explanations.
        </p>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-4 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"
        >
          Refresh
        </button>
      </header>

      {outcomes ?
        <section className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
          <h2 className="text-sm font-semibold text-[#D4AF37]">Outcome rates ({outcomes.windowDays}d)</h2>
          <p className="mt-2 text-sm text-slate-300">CTR (clicked / shown): {outcomes.ctr != null ? outcomes.ctr.toFixed(3) : "—"}</p>
          <pre className="mt-2 max-h-48 overflow-auto text-xs text-slate-400">{JSON.stringify(outcomes.counts, null, 2)}</pre>
        </section>
      : null}

      <section className="rounded-xl border border-white/10 bg-black/40 p-4">
        <h2 className="text-sm font-semibold text-[#D4AF37]">Sample payload (BUYER + debug)</h2>
        {loading ?
          <p className="mt-2 text-sm text-slate-500">Loading…</p>
        : <pre className="mt-2 max-h-[480px] overflow-auto text-xs text-emerald-200/90">{buyerJson}</pre>}
      </section>
    </div>
  );
}
