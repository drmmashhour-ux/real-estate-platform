"use client";

import * as React from "react";
import type { BrokerPerformanceSummary } from "@/modules/broker/performance/broker-performance.types";

function bandStyle(b: string): string {
  if (b === "strong") return "bg-emerald-500/20 text-emerald-200 border-emerald-500/40";
  if (b === "good") return "bg-sky-500/15 text-sky-100 border-sky-500/35";
  if (b === "watch") return "bg-amber-500/15 text-amber-100 border-amber-500/35";
  return "bg-rose-500/15 text-rose-100 border-rose-500/35";
}

export function BrokerPerformancePanel({ accent = "#10b981" }: { accent?: string }) {
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);
  const [summary, setSummary] = React.useState<BrokerPerformanceSummary | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setErr(null);
      setLoading(true);
      try {
        const res = await fetch("/api/broker/performance", { credentials: "same-origin" });
        if (res.status === 404) {
          if (!cancelled) setErr("Performance scoring is not enabled.");
          return;
        }
        const data = (await res.json()) as { summary?: BrokerPerformanceSummary; error?: string };
        if (!res.ok) {
          if (!cancelled) setErr(data.error ?? "Failed to load");
          return;
        }
        if (!cancelled) setSummary(data.summary ?? null);
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
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <p className="text-sm text-slate-400">Loading performance…</p>
      </section>
    );
  }
  if (err || !summary) {
    return err ? (
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">{err}</section>
    ) : null;
  }

  const b = summary.breakdown;

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Performance</p>
          <h2 className="mt-1 text-lg font-semibold text-white">Broker Performance</h2>
          <p className="mt-1 max-w-xl text-xs text-slate-500">
            Advisory score from CRM progression, timing, and paid lead-unlock activity — not a quality guarantee and not
            used to block access.
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold tabular-nums text-white">{summary.overallScore}</p>
          <span
            className={`mt-1 inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${bandStyle(summary.band)}`}
          >
            {summary.band}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-5">
        {(
          [
            ["Response speed", b.responseSpeedScore],
            ["Contact rate", b.contactRateScore],
            ["Engagement", b.engagementScore],
            ["Close signals", b.closeSignalScore],
            ["Retention", b.retentionScore],
          ] as const
        ).map(([label, v]) => (
          <div key={label} className="rounded-lg border border-white/10 bg-black/25 px-2 py-2 text-center">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
            <p className="text-lg font-semibold tabular-nums text-white" style={{ color: accent }}>
              {v}
            </p>
          </div>
        ))}
      </div>

      {summary.strongSignals.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs font-medium text-emerald-400/90">Strong signals</p>
          <ul className="mt-1 list-inside list-disc text-xs text-slate-300">
            {summary.strongSignals.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {summary.weakSignals.length > 0 ? (
        <div className="mt-3">
          <p className="text-xs font-medium text-amber-400/90">Weak / limited data</p>
          <ul className="mt-1 list-inside list-disc text-xs text-slate-400">
            {summary.weakSignals.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {summary.recommendations.length > 0 ? (
        <div className="mt-4 border-t border-white/10 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recommendations</p>
          <ul className="mt-2 space-y-2">
            {summary.recommendations.map((r) => (
              <li key={r.id} className="rounded-lg border border-white/10 bg-black/20 p-2 text-xs">
                <span className="font-medium text-white">{r.title}</span>{" "}
                <span className="text-slate-500">({r.impact})</span>
                <p className="mt-0.5 text-slate-400">{r.description}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
