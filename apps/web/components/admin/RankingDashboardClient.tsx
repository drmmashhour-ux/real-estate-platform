"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { RankingConfigClient } from "@/app/admin/ranking/ranking-config-client";

type RankingConfigRow = {
  id: string;
  configKey: string;
  listingType: string;
  weightsJson: unknown;
  isActive: boolean;
};

type ScoreRow = {
  listingId: string;
  totalScore: number;
  relevanceScore: number;
  trustScore: number;
  qualityScore: number;
  city: string | null;
};

export function RankingDashboardClient({
  initialLegacyWeights,
}: {
  initialLegacyWeights: Record<string, number>;
}) {
  const [configs, setConfigs] = useState<RankingConfigRow[]>([]);
  const [topBnhub, setTopBnhub] = useState<ScoreRow[]>([]);
  const [topRe, setTopRe] = useState<ScoreRow[]>([]);
  const [insights, setInsights] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [c, b, r] = await Promise.all([
      fetch("/api/admin/ranking/configs").then((x) => x.json()),
      fetch("/api/admin/ranking/listings?listingType=bnhub&take=15").then((x) => x.json()),
      fetch("/api/admin/ranking/listings?listingType=real_estate&take=15").then((x) => x.json()),
    ]);
    setConfigs(Array.isArray(c.configs) ? c.configs : []);
    setTopBnhub(Array.isArray(b.listings) ? b.listings : []);
    setTopRe(Array.isArray(r.listings) ? r.listings : []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function seedConfigs() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/ranking/configs", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setConfigs(data.configs ?? []);
        setMsg("Default configs ensured.");
      } else setMsg(data.error ?? "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function recomputeAll() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/ranking/recompute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: "all" }),
      });
      const data = await res.json();
      if (res.ok) setMsg(`Recomputed — BNHub: ${data.bnhub ?? 0}, FSBO: ${data.realEstate ?? 0}`);
      else setMsg(data.error ?? "Failed");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function loadInsights() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/ranking/insights");
      setInsights(await res.json());
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-10">
      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-lg font-semibold text-white">Ranking engine (AI_RANKING_ENGINE_ENABLED)</h2>
        <p className="mt-1 text-sm text-slate-400">
          Explainable scores from real DB signals. BNHub stays search uses this when sort = Recommended and the env flag
          is on.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => void seedConfigs()}
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600 disabled:opacity-50"
          >
            Seed default configs
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void recomputeAll()}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            Recompute all scores
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void loadInsights()}
            className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 disabled:opacity-50"
          >
            Load CTR / anomaly insights
          </button>
        </div>
        {msg ? <p className="mt-3 text-sm text-amber-200">{msg}</p> : null}
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-lg font-semibold text-white">Active weight profiles</h2>
        <ul className="mt-3 space-y-4 text-sm text-slate-300">
          {configs.map((c) => (
            <li key={c.id} className="rounded-lg border border-slate-800 p-3">
              <p className="font-medium text-emerald-300">{c.configKey}</p>
              <p className="text-xs text-slate-500">{c.listingType}</p>
              <pre className="mt-2 max-h-32 overflow-auto text-xs text-slate-400">
                {JSON.stringify(c.weightsJson, null, 2)}
              </pre>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-lg font-semibold text-white">Top BNHub (persisted scores)</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {topBnhub.map((r) => (
              <li key={r.listingId} className="flex justify-between gap-2 border-b border-slate-800/80 py-1">
                <Link href={`/bnhub/${r.listingId}`} className="truncate text-amber-300 hover:underline">
                  {r.listingId.slice(0, 8)}…
                </Link>
                <span className="shrink-0 text-slate-200">{r.totalScore.toFixed(1)}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-lg font-semibold text-white">Top FSBO (persisted scores)</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {topRe.map((r) => (
              <li key={r.listingId} className="flex justify-between gap-2 border-b border-slate-800/80 py-1">
                <Link href={`/listings/${r.listingId}`} className="truncate text-amber-300 hover:underline">
                  {r.listingId.slice(0, 8)}…
                </Link>
                <span className="shrink-0 text-slate-200">{r.totalScore.toFixed(1)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-lg font-semibold text-white">Insights (impressions / clicks)</h2>
        <pre className="mt-3 max-h-64 overflow-auto text-xs text-slate-400">
          {insights ? JSON.stringify(insights, null, 2) : "Click “Load CTR / anomaly insights”."}
        </pre>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-lg font-semibold text-white">Legacy BNHub search weights (SearchRankingConfig)</h2>
        <p className="mt-1 text-sm text-slate-500">Used when AI ranking engine is off.</p>
        <RankingConfigClient initialWeights={initialLegacyWeights} />
      </section>
    </div>
  );
}
