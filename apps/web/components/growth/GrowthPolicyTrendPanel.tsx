"use client";

import * as React from "react";

import type { PolicyTrendSummary } from "@/modules/growth/policy/growth-policy-trend.types";

function trendBadgeClass(t: string): string {
  if (t === "improving") return "border-emerald-500/40 bg-emerald-950/30 text-emerald-200";
  if (t === "worsening") return "border-red-500/40 bg-red-950/30 text-red-200";
  if (t === "stable") return "border-zinc-500/40 bg-zinc-900/50 text-zinc-200";
  return "border-amber-500/40 bg-amber-950/30 text-amber-200";
}

function confClass(c: string): string {
  if (c === "high") return "text-emerald-300";
  if (c === "medium") return "text-amber-200";
  return "text-zinc-500";
}

export function GrowthPolicyTrendPanel() {
  const [windowDays, setWindowDays] = React.useState<7 | 30>(7);
  const [data, setData] = React.useState<PolicyTrendSummary | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetch(`/api/growth/policy/trends?windowDays=${windowDays}`, { credentials: "same-origin" })
      .then(async (r) => {
        const j = (await r.json()) as { summary?: PolicyTrendSummary; error?: string };
        if (!r.ok) throw new Error(j.error ?? "Failed");
        return j.summary!;
      })
      .then((s) => {
        if (!cancelled) {
          setData(s);
          setErr(null);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) setErr(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [windowDays]);

  if (loading && !data) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-black/40 p-4 text-sm text-zinc-500">
        Loading policy trends…
      </div>
    );
  }
  if (err) {
    return (
      <div className="rounded-xl border border-red-900/45 bg-red-950/25 p-4 text-sm text-red-200">
        Policy trends: {err}
      </div>
    );
  }
  if (!data) return null;

  const dailyRisks = data.series.map((p) =>
    p.hasData
      ? 3 * p.criticalCount + p.warningCount + 2 * p.recurringCount + 0.25 * p.infoCount
      : 0,
  );
  const peakRisk = Math.max(1, ...dailyRisks);

  return (
    <section
      className="rounded-xl border border-teal-900/35 bg-black/55 p-4 shadow-[0_0_0_1px_rgba(45,212,191,0.08)]"
      data-growth-policy-trends-v1
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold tracking-tight text-teal-100">Policy safety trends</p>
          <p className="mt-0.5 max-w-xl text-[10px] text-zinc-500">
            Derived from UTC daily snapshots only — half-over-half comparison is descriptive, not proof of cause. Low confidence when
            polling is sparse. Current policy findings override any narrative here.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1 text-[10px] text-zinc-500">
            Window
            <select
              className="rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-[11px] text-zinc-200"
              value={windowDays}
              onChange={(e) => setWindowDays(Number(e.target.value) === 30 ? 30 : 7)}
            >
              <option value={7}>7d</option>
              <option value={30}>30d</option>
            </select>
          </label>
          <span className={`text-[10px] font-semibold uppercase tracking-wide ${confClass(data.confidence)}`}>
            confidence: {data.confidence}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className={`rounded-lg border px-3 py-2 ${trendBadgeClass(data.overallTrend)}`}>
          <p className="text-[9px] uppercase tracking-[0.14em] opacity-90">Overall</p>
          <p className="mt-1 text-lg font-semibold capitalize">{data.overallTrend.replace(/_/g, " ")}</p>
        </div>
        <div className={`rounded-lg border px-3 py-2 ${trendBadgeClass(data.severityTrend)}`}>
          <p className="text-[9px] uppercase tracking-[0.14em] opacity-90">Severity</p>
          <p className="mt-1 text-lg font-semibold capitalize">{data.severityTrend.replace(/_/g, " ")}</p>
        </div>
        <div className={`rounded-lg border px-3 py-2 ${trendBadgeClass(data.recurrenceTrend)}`}>
          <p className="text-[9px] uppercase tracking-[0.14em] opacity-90">Recurrence</p>
          <p className="mt-1 text-lg font-semibold capitalize">{data.recurrenceTrend.replace(/_/g, " ")}</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-[11px] text-zinc-400">
          <p className="text-[9px] uppercase tracking-[0.14em] text-zinc-500">Sparkless strip</p>
          <div className="mt-2 flex h-8 items-end gap-0.5">
            {data.series.map((p) => {
              const r = p.hasData
                ? 3 * p.criticalCount + p.warningCount + 2 * p.recurringCount + 0.25 * p.infoCount
                : 0;
              const h = p.hasData ? Math.max(2, Math.round((r / peakRisk) * 28)) : 2;
              return (
                <div key={p.date} className="flex w-full flex-col items-center gap-0.5">
                  <div
                    className={`w-full rounded-sm ${p.hasData ? "bg-teal-500/50" : "bg-zinc-800/80"}`}
                    style={{ height: `${Math.max(2, h)}px` }}
                    title={`${p.date}: crit ${p.criticalCount} warn ${p.warningCount} rec ${p.recurringCount}`}
                  />
                  <span className="rotate-45 text-[7px] text-zinc-600">{p.date.slice(5)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {data.domainTrends.length > 0 ? (
        <div className="mt-4 border-t border-zinc-800 pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Domains</p>
          <ul className="mt-2 space-y-1.5">
            {data.domainTrends.map((d) => (
              <li key={d.domain} className="text-[11px] text-zinc-300">
                <span className="font-semibold text-teal-200/90">{d.domain}</span>{" "}
                <span className="text-zinc-500">{d.trend}</span> · {d.explanation}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Highlights</p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-[11px] text-zinc-400">
            {data.highlights.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-600/90">Warnings</p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-[11px] text-amber-200/80">
            {data.warnings.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
