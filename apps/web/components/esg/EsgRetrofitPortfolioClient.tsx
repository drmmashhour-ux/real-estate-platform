"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Row = {
  listingId: string;
  listingTitle: string | null;
  listingCode: string | null;
  strategyType: string | null;
  totalEstimatedCostBand: string | null;
  totalEstimatedImpactBand: string | null;
  totalTimelineBand: string | null;
  updatedAt: string | null;
  openActions: number;
};

export function EsgRetrofitPortfolioClient() {
  const [data, setData] = useState<{
    listings: Row[];
    topRetrofitCandidates: Row[];
    carbonOpportunities: Row[];
    financingFriendly: Row[];
  } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/esg/retrofit/portfolio", { credentials: "same-origin" });
      const j = (await res.json()) as typeof data & { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Failed");
      setData({
        listings: j.listings ?? [],
        topRetrofitCandidates: j.topRetrofitCandidates ?? [],
        carbonOpportunities: j.carbonOpportunities ?? [],
        financingFriendly: j.financingFriendly ?? [],
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function table(title: string, rows: Row[]) {
    return (
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <div className="mt-3 overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/5 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2">Listing</th>
                <th className="px-4 py-2">Impact band</th>
                <th className="px-4 py-2">Cost band</th>
                <th className="px-4 py-2">Open actions</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ?
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={5}>
                    No rows yet — generate retrofit plans per asset.
                  </td>
                </tr>
              : rows.map((r) => (
                  <tr key={r.listingId} className="border-t border-white/10">
                    <td className="px-4 py-3 text-slate-200">
                      <span className="font-medium text-white">{r.listingTitle ?? r.listingCode ?? r.listingId}</span>
                      <span className="ml-2 text-xs text-slate-500">{r.listingCode}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{r.totalEstimatedImpactBand ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-300">{r.totalEstimatedCostBand ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-300">{r.openActions}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/dashboard/esg/retrofit/${r.listingId}`}
                        className="text-xs font-semibold text-emerald-400 hover:text-emerald-300"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">ESG · Portfolio</p>
          <h1 className="mt-1 text-2xl font-semibold text-white">Retrofit portfolio</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Aggregated OPTIMIZED-plan signals across your listings — heuristic rankings, not performance guarantees.
          </p>
        </div>
        <Link
          href="/dashboard/esg"
          className="rounded-xl border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/5"
        >
          ESG dashboard
        </Link>
      </div>

      {err ? <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">{err}</p> : null}
      {loading ?
        <p className="text-sm text-slate-500">Loading…</p>
      : data ?
        <>
          {table("Best retrofit candidates (material impact band heuristic)", data.topRetrofitCandidates)}
          {table("Carbon reduction opportunities (open-action depth)", data.carbonOpportunities)}
          {table("Financing narrative readiness (plans present)", data.financingFriendly)}
          {table("All listings", data.listings)}
        </>
      : null}
    </div>
  );
}
