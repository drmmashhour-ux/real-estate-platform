"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type PortfolioJson = {
  summary: {
    totalAssets: number;
    totalOpenActions: number;
    criticalActions: number;
    quickWins: number;
    capexActions: number;
    averagePotentialScoreUplift: number | null;
    createdAt?: string;
  } | null;
  topPriorityAssets: Array<{
    listingId: string;
    title: string;
    code: string;
    critical: number;
    total: number;
  }>;
  bestQuickWins: Array<{ id: string; listingId: string; listingTitle: string; title: string; priority: string }>;
  capexCandidates: Array<{ id: string; listingId: string; listingTitle: string; title: string; costBand: string | null }>;
  blockers: Array<{ id: string; listingId: string; listingTitle: string; title: string }>;
};

export function EsgActionCenterPortfolioClient() {
  const [data, setData] = useState<PortfolioJson | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/esg/action-center/portfolio", { credentials: "same-origin" });
      const j = (await res.json()) as PortfolioJson & { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Failed");
      setData(j);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function recompute() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/esg/action-center/portfolio/recompute", {
        method: "POST",
        credentials: "same-origin",
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Failed");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="text-sm text-slate-500">Loading portfolio…</p>;
  if (err) return <p className="text-sm text-red-400">{err}</p>;
  if (!data) return null;

  const s = data.summary;

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400/90">Portfolio</p>
          <h2 className="mt-1 text-xl font-semibold text-white">ESG action priorities</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">
            Aggregated across listings you can access. Directional uplift only — not investment advice.
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void recompute()}
          className="rounded-lg border border-white/15 px-4 py-2 text-xs font-semibold text-white hover:bg-white/5 disabled:opacity-40"
        >
          {busy ? "Refreshing…" : "Recompute summary"}
        </button>
      </div>

      {s ? (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: "Assets", value: s.totalAssets },
            { label: "Open actions", value: s.totalOpenActions },
            { label: "Critical", value: s.criticalActions },
            { label: "Quick wins", value: s.quickWins },
            { label: "Capex-type", value: s.capexActions },
          ].map((c) => (
            <div key={c.label} className="rounded-xl border border-white/10 bg-black/35 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">{c.label}</p>
              <p className="mt-1 text-2xl font-semibold text-white">{c.value}</p>
            </div>
          ))}
        </section>
      ) : (
        <p className="text-sm text-slate-500">
          No cached portfolio summary yet — click &quot;Recompute summary&quot; after generating asset actions.
        </p>
      )}

      <section className="rounded-2xl border border-white/10 bg-[#121212] p-6">
        <h3 className="text-sm font-semibold text-white">Top priority assets</h3>
        <ul className="mt-4 space-y-2 text-sm">
          {data.topPriorityAssets.length === 0 ?
            <li className="text-slate-500">No open actions.</li>
          : data.topPriorityAssets.map((a) => (
              <li key={a.listingId} className="flex flex-wrap justify-between gap-2 border-b border-white/5 py-2">
                <Link
                  href={`/dashboard/esg/action-center/${a.listingId}`}
                  className="font-medium text-premium-gold hover:underline"
                >
                  {a.code} — {a.title.slice(0, 56)}
                  {a.title.length > 56 ? "…" : ""}
                </Link>
                <span className="text-xs text-slate-500">
                  critical {a.critical} · open {a.total}
                </span>
              </li>
            ))
          }
        </ul>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-emerald-500/20 bg-emerald-950/15 p-6">
          <h3 className="text-sm font-semibold text-emerald-100">Quick wins</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-200">
            {data.bestQuickWins.length === 0 ?
              <li className="text-slate-500">None surfaced.</li>
            : data.bestQuickWins.map((w) => (
                <li key={w.id}>
                  <span className="text-slate-400">{w.listingTitle.slice(0, 32)} · </span>
                  {w.title}
                </li>
              ))
            }
          </ul>
        </section>
        <section className="rounded-2xl border border-amber-500/20 bg-amber-950/15 p-6">
          <h3 className="text-sm font-semibold text-amber-100">Capex candidates</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-200">
            {data.capexCandidates.length === 0 ?
              <li className="text-slate-500">None surfaced.</li>
            : data.capexCandidates.map((w) => (
                <li key={w.id}>
                  {w.title}{" "}
                  <span className="text-xs text-slate-500">({w.costBand ?? "cost TBD"})</span>
                </li>
              ))
            }
          </ul>
        </section>
      </div>

      <section className="rounded-2xl border border-rose-500/25 bg-rose-950/15 p-6">
        <h3 className="text-sm font-semibold text-rose-100">Acquisition / diligence blockers</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-200">
          {data.blockers.length === 0 ?
            <li className="text-slate-500">No critical-only rows in this slice.</li>
          : data.blockers.map((w) => (
              <li key={w.id}>
                <Link href={`/dashboard/esg/action-center/${w.listingId}`} className="text-premium-gold hover:underline">
                  {w.listingTitle.slice(0, 28)}
                </Link>
                {" · "}
                {w.title}
              </li>
            ))
          }
        </ul>
      </section>
    </div>
  );
}
