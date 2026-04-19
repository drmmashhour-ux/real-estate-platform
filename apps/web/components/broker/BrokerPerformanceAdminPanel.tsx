"use client";

import * as React from "react";
import type { BrokerLeaderboardRow } from "@/modules/broker/performance/broker-performance.types";

type Payload = {
  rows?: BrokerLeaderboardRow[];
  topPerformers?: BrokerLeaderboardRow[];
  weakestPerformers?: BrokerLeaderboardRow[];
  insufficientData?: BrokerLeaderboardRow[];
  disclaimer?: string;
  error?: string;
};

function bandClass(b: string): string {
  if (b === "elite") return "bg-violet-500/20 text-violet-100 border-violet-500/40";
  if (b === "strong") return "bg-emerald-500/20 text-emerald-200 border-emerald-500/40";
  if (b === "healthy") return "bg-sky-500/15 text-sky-100 border-sky-500/35";
  if (b === "weak") return "bg-amber-500/15 text-amber-100 border-amber-500/35";
  return "bg-slate-500/15 text-slate-300 border-slate-500/30";
}

function MiniTable({ title, rows }: { title: string; rows: BrokerLeaderboardRow[] }) {
  if (rows.length === 0) {
    return (
      <section className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        <p className="mt-2 text-xs text-slate-500">No rows in this cohort.</p>
      </section>
    );
  }
  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      <ul className="mt-3 space-y-2">
        {rows.map((r) => (
          <li
            key={r.brokerId}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs"
          >
            <div>
              <p className="font-medium text-slate-100">{r.displayName}</p>
              <p className="text-[11px] text-slate-500">
                Strength: {r.keyStrength} · Watch: {r.keyWeakness}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="tabular-nums text-lg font-semibold text-white">{r.overallScore}</span>
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${bandClass(r.band)}`}
              >
                {r.band.replace(/_/g, " ")}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function BrokerPerformanceAdminPanel() {
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);
  const [data, setData] = React.useState<Payload | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setErr(null);
      setLoading(true);
      try {
        const res = await fetch("/api/admin/broker-execution-performance", { credentials: "same-origin" });
        const json = (await res.json()) as Payload;
        if (res.status === 404) {
          if (!cancelled) setErr("Broker performance engine is disabled (feature flag).");
          return;
        }
        if (!res.ok) {
          if (!cancelled) setErr(json.error ?? "Failed to load");
          return;
        }
        if (!cancelled) setData(json);
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
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-sm text-slate-400">
        Loading internal leaderboard…
      </div>
    );
  }
  if (err) {
    return <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">{err}</div>;
  }
  if (!data?.rows) return null;

  return (
    <div className="space-y-6">
      {data.disclaimer ? <p className="text-xs text-slate-500">{data.disclaimer}</p> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <MiniTable title="Top performers (sufficient data)" rows={data.topPerformers ?? []} />
        <MiniTable title="Coaching priority (lower execution score)" rows={data.weakestPerformers ?? []} />
      </div>

      <MiniTable title="Insufficient sample (needs more assigned leads)" rows={data.insufficientData ?? []} />

      <section className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <h2 className="text-sm font-semibold text-white">Full internal sort ({data.rows.length} brokers scanned)</h2>
        <div className="mt-3 max-h-[420px] overflow-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-black/80 text-[10px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="py-2 pr-2">Broker</th>
                <th className="py-2 pr-2">Score</th>
                <th className="py-2 pr-2">Band</th>
                <th className="py-2">Strength / watch</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r) => (
                <tr key={r.brokerId} className="border-t border-white/5">
                  <td className="py-2 pr-2 font-medium text-slate-200">{r.displayName}</td>
                  <td className="py-2 pr-2 tabular-nums text-slate-100">{r.overallScore}</td>
                  <td className="py-2 pr-2">
                    <span
                      className={`inline-block rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${bandClass(r.band)}`}
                    >
                      {r.band.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="py-2 text-slate-500">
                    {r.keyStrength} · {r.keyWeakness}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
