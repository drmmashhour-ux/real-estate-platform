"use client";

import * as React from "react";
import type {
  BrokerMarketplaceRanking,
  BrokerRoutingReadinessSummary,
} from "@/modules/broker/performance/broker-performance.types";

function bandBadge(b: string): string {
  if (b === "strong") return "bg-emerald-500/20 text-emerald-200";
  if (b === "good") return "bg-sky-500/20 text-sky-100";
  if (b === "watch") return "bg-amber-500/20 text-amber-100";
  return "bg-rose-500/20 text-rose-100";
}

export function BrokerMarketplaceRankingPanel() {
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);
  const [rankings, setRankings] = React.useState<BrokerMarketplaceRanking[]>([]);
  const [readiness, setReadiness] = React.useState<BrokerRoutingReadinessSummary | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setErr(null);
      setLoading(true);
      try {
        const res = await fetch("/api/admin/broker-performance", { credentials: "same-origin" });
        if (res.status === 404) {
          if (!cancelled) setErr("Marketplace ranking is not enabled.");
          return;
        }
        const data = (await res.json()) as {
          rankings?: BrokerMarketplaceRanking[];
          readiness?: BrokerRoutingReadinessSummary;
          error?: string;
        };
        if (!res.ok) {
          if (!cancelled) setErr(data.error ?? "Failed to load");
          return;
        }
        if (!cancelled) {
          setRankings(Array.isArray(data.rankings) ? data.rankings : []);
          setReadiness(data.readiness ?? null);
        }
      } catch {
        if (!cancelled) setErr("Network error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <p className="text-sm text-slate-400">Loading marketplace ranking…</p>;
  }
  if (err) {
    return <p className="text-sm text-slate-500">{err}</p>;
  }

  return (
    <section className="mt-10 border-t border-slate-800 pt-8">
      <h2 className="text-lg font-medium text-slate-200">Marketplace performance ranking (internal)</h2>
      <p className="mt-1 text-sm text-slate-400">
        Advisory ordering from CRM + billing signals. Does not route leads, hide brokers, or change billing. Not for
        public display in V1.
      </p>

      {readiness ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2">
            <div className="text-xs uppercase text-slate-500">Brokers scored</div>
            <div className="text-xl font-semibold text-white">{readiness.totalBrokersScored}</div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2">
            <div className="text-xs uppercase text-slate-500">Strong band</div>
            <div className="text-xl font-semibold text-emerald-300">{readiness.highQualityBrokers}</div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2">
            <div className="text-xs uppercase text-slate-500">Watch / low</div>
            <div className="text-xl font-semibold text-amber-200">{readiness.needsImprovementBrokers}</div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2">
            <div className="text-xs uppercase text-slate-500">Routing experiments (advisory)</div>
            <div className="text-xl font-semibold text-slate-100">
              {readiness.routingExperimentsAdvisable ? "Possibly" : "Not yet"}
            </div>
          </div>
        </div>
      ) : null}

      {readiness?.notes?.length ? (
        <ul className="mt-3 list-inside list-disc text-xs text-slate-500">
          {readiness.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      ) : null}

      <div className="mt-6 max-h-[420px] overflow-y-auto rounded-lg border border-slate-800">
        <table className="min-w-full text-left text-sm text-slate-300">
          <thead className="sticky top-0 border-b border-slate-800 bg-slate-900/90 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Broker id</th>
              <th className="px-3 py-2">Score</th>
              <th className="px-3 py-2">Band</th>
              <th className="px-3 py-2">Why (top)</th>
            </tr>
          </thead>
          <tbody>
            {rankings.map((r, i) => (
              <tr key={r.brokerId} className="border-b border-slate-800/80">
                <td className="px-3 py-2 text-slate-500">{i + 1}</td>
                <td className="px-3 py-2 font-mono text-xs text-slate-400">{r.brokerId.slice(0, 12)}…</td>
                <td className="px-3 py-2 tabular-nums text-white">{r.rankScore}</td>
                <td className="px-3 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${bandBadge(r.band)}`}>
                    {r.band}
                  </span>
                </td>
                <td className="max-w-md px-3 py-2 text-xs text-slate-400">
                  {r.why.slice(0, 2).join(" · ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rankings.length === 0 ? <p className="p-4 text-sm text-slate-500">No brokers to rank.</p> : null}
      </div>
    </section>
  );
}
