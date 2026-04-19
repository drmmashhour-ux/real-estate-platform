"use client";

import * as React from "react";
import type { RevenueForecast } from "@/modules/growth/revenue-forecast.types";

export function RevenueForecastPanel() {
  const [forecast, setForecast] = React.useState<RevenueForecast | null>(null);
  const [disclaimer, setDisclaimer] = React.useState("");
  const [err, setErr] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    void fetch("/api/growth/revenue-forecast?windowDays=14", { credentials: "same-origin" })
      .then(async (r) => {
        const j = (await r.json()) as { forecast: RevenueForecast; disclaimer?: string; error?: string };
        if (!r.ok) throw new Error(j.error ?? "Failed");
        setForecast(j.forecast);
        setDisclaimer(j.disclaimer ?? "");
        setErr(null);
      })
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : "Error"));
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  if (err) {
    return (
      <section className="rounded-xl border border-amber-900/40 bg-amber-950/15 p-4">
        <h3 className="text-lg font-semibold text-zinc-100">Revenue forecast</h3>
        <p className="mt-2 text-sm text-amber-200/90">{err}</p>
      </section>
    );
  }

  if (!forecast) {
    return (
      <section className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
        <p className="text-xs text-zinc-500">Loading revenue forecast…</p>
      </section>
    );
  }

  const f = forecast;
  const rev = f.revenue;

  return (
    <section
      id="growth-mc-revenue-forecast"
      className="scroll-mt-24 rounded-xl border border-teal-900/45 bg-teal-950/15 p-4"
      data-growth-revenue-forecast-v1
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-teal-300/90">
            Forward-looking (illustrative)
          </p>
          <h3 className="mt-1 text-lg font-semibold text-zinc-100">Revenue forecast & predictability</h3>
          <p className="mt-1 max-w-2xl text-[11px] text-zinc-500">
            Confidence <strong className="text-zinc-300">{f.meta.confidence}</strong> · momentum{" "}
            <strong className="text-zinc-300">{f.trend.momentum}</strong>
            {f.trend.growthRate != null ? (
              <>
                {" "}
                · WoW composite {(f.trend.growthRate * 100).toFixed(1)}%
              </>
            ) : null}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-zinc-800 bg-black/25 p-3">
          <p className="text-xs text-zinc-500">Expected (central)</p>
          <p className="text-xl font-semibold text-teal-200/95">
            {rev.expectedRevenue != null ? `≈ ${rev.expectedRevenue.toLocaleString()} CAD` : "—"}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-black/25 p-3">
          <p className="text-xs text-zinc-500">Conservative · Optimistic</p>
          <p className="text-sm text-zinc-200">
            {rev.conservativeEstimate != null ? rev.conservativeEstimate.toLocaleString() : "—"} ·{" "}
            {rev.optimisticEstimate != null ? rev.optimisticEstimate.toLocaleString() : "—"}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-black/25 p-3">
          <p className="text-xs text-zinc-500">Pipeline window</p>
          <ul className="mt-1 text-sm text-zinc-300">
            <li>Leads: {f.pipeline.leads}</li>
            <li>Qualified+: {f.pipeline.qualified}</li>
            <li>Meetings+: {f.pipeline.meetings}</li>
            <li>P(close joint): {f.pipeline.closingProbability?.toFixed(3) ?? "—"}</li>
          </ul>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-zinc-800 bg-black/20 p-3">
        <p className="text-xs font-semibold text-zinc-400">Risk indicators</p>
        <ul className="mt-2 flex flex-wrap gap-4 text-sm text-zinc-300">
          <li>Drop-off: {f.risk.dropOffRisk}</li>
          <li>Execution: {f.risk.executionRisk}</li>
          <li>Data: {f.risk.dataRisk}</li>
        </ul>
      </div>

      {f.meta.insufficientData ? (
        <p className="mt-3 rounded border border-amber-900/40 bg-amber-950/25 px-3 py-2 text-xs text-amber-100/90">
          Insufficient CRM density — numeric range withheld. See warnings.
        </p>
      ) : null}

      <ul className="mt-3 space-y-1 text-[11px] text-amber-100/85">
        {f.meta.warnings.map((w) => (
          <li key={w}>⚠ {w}</li>
        ))}
      </ul>
      <p className="mt-1 text-[10px] text-zinc-600">{f.meta.avgDealValueSource}</p>
      <p className="mt-2 text-[10px] text-zinc-600">{disclaimer}</p>
      <button type="button" className="mt-2 text-xs text-teal-400 hover:underline" onClick={() => load()}>
        Refresh
      </button>
    </section>
  );
}
