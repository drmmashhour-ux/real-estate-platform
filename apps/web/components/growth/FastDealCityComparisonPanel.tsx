"use client";

import * as React from "react";
import type { FastDealCityComparison } from "@/modules/growth/fast-deal-city-comparison.types";

export function FastDealCityComparisonPanel() {
  const [data, setData] = React.useState<FastDealCityComparison | null | "err" | "loading">("loading");
  const [disclaimer, setDisclaimer] = React.useState("");

  React.useEffect(() => {
    let cancel = false;
    (async () => {
      const params = new URLSearchParams({ windowDays: "30" });
      const res = await fetch(`/api/admin/growth/fast-deal/city-comparison?${params}`, {
        credentials: "same-origin",
      });
      if (cancel) return;
      if (!res.ok) {
        setData("err");
        return;
      }
      const j = (await res.json()) as {
        comparison: FastDealCityComparison | null;
        disclaimer?: string;
      };
      setData(j.comparison);
      setDisclaimer(j.disclaimer ?? "");
    })();
    return () => {
      cancel = true;
    };
  }, []);

  if (data === "loading") {
    return (
      <section className="rounded-xl border border-violet-900/40 bg-violet-950/10 p-4" data-growth-fast-deal-city>
        <p className="text-xs text-zinc-500">Loading city comparison…</p>
      </section>
    );
  }
  if (data === "err" || !data) {
    return (
      <section className="rounded-xl border border-violet-900/40 bg-violet-950/10 p-4" data-growth-fast-deal-city>
        <p className="text-sm text-amber-200/90">City comparison unavailable (admin + flags).</p>
      </section>
    );
  }

  const fmtPct = (v?: number) =>
    v == null ? "—" : `${Math.round(Math.min(100, Math.max(0, v * 100)))}%`;

  const fmtRate = (label: string, v?: number) =>
    v == null ? `${label}: — (insufficient data)` : `${label}: ${fmtPct(v)}`;

  return (
    <section className="rounded-xl border border-violet-800/45 bg-violet-950/20 p-4" data-growth-fast-deal-city>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-violet-300/90">Fast Deal · Cities</p>
        <h3 className="mt-1 text-lg font-semibold text-zinc-100">City comparison (internal)</h3>
        <p className="mt-1 max-w-3xl text-[11px] text-zinc-500">
          Operator-logged signals attributed by city metadata — not causal proof.
          {disclaimer ? ` ${disclaimer}` : ""}
        </p>
      </div>

      <div className="mt-3 rounded-lg border border-amber-500/25 bg-amber-950/15 px-3 py-2 text-[11px] text-amber-100/90">
        Low-confidence rows still appear — never treat rank as “best city” without reading warnings and sample sizes.
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[960px] border-collapse text-left text-xs text-zinc-300">
          <thead>
            <tr className="border-b border-white/10 text-[10px] uppercase tracking-wide text-zinc-500">
              <th className="py-2 pr-2">Rank</th>
              <th className="py-2 pr-2">City</th>
              <th className="py-2 pr-2">Score</th>
              <th className="py-2 pr-2">Confidence</th>
              <th className="py-2 pr-2">Captures</th>
              <th className="py-2 pr-2">Playbook completion</th>
              <th className="py-2 pr-2">Progression</th>
              <th className="py-2 pr-2">Sample</th>
              <th className="py-2">Completeness</th>
            </tr>
          </thead>
          <tbody>
            {data.rankedCities.map((row, idx) => (
              <tr key={row.city} className="border-b border-white/5">
                <td className="py-2 pr-2 font-semibold text-violet-200">#{idx + 1}</td>
                <td className="py-2 pr-2 font-medium text-white">{row.city}</td>
                <td className="py-2 pr-2 tabular-nums">{row.performanceScore}</td>
                <td className="py-2 pr-2 capitalize">{row.confidence}</td>
                <td className="py-2 pr-2 tabular-nums">{row.activity.leadsCaptured ?? "—"}</td>
                <td className="py-2 pr-2">{fmtPct(row.derived.playbookCompletionRate)}</td>
                <td className="py-2 pr-2">{fmtPct(row.derived.progressionRate)}</td>
                <td className="py-2 pr-2 tabular-nums">{row.meta.sampleSize}</td>
                <td className="py-2 capitalize text-zinc-400">{row.meta.dataCompleteness}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-zinc-800 bg-black/25 p-3">
          <p className="text-xs font-semibold text-zinc-400">Derived rates (when computable)</p>
          <ul className="mt-2 space-y-1 text-sm">
            {data.rankedCities.map((row) => (
              <li key={`d-${row.city}`}>
                <span className="font-medium text-zinc-200">{row.city}:</span>{" "}
                {fmtRate("capture", row.derived.captureRate)} ·{" "}
                {fmtRate("playbook completion", row.derived.playbookCompletionRate)} ·{" "}
                {fmtRate("progression", row.derived.progressionRate)} ·{" "}
                {fmtRate("close", row.derived.closeRate)}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-black/25 p-3">
          <p className="text-xs font-semibold text-zinc-400">Insights</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-zinc-400">
            {data.insights.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-red-900/30 bg-black/30 p-3">
        <p className="text-xs font-semibold text-red-300/90">Warnings (all cities)</p>
        <ul className="mt-2 space-y-2 text-[11px] text-zinc-500">
          {data.rankedCities.map((row) =>
            row.scoringWarnings.length + row.meta.warnings.length === 0 ? null : (
              <li key={`w-${row.city}`}>
                <span className="font-semibold text-zinc-400">{row.city}:</span>{" "}
                {[...row.meta.warnings, ...row.scoringWarnings].join(" · ")}
              </li>
            ),
          )}
        </ul>
      </div>

      <p className="mt-3 text-[10px] text-zinc-600">Generated {new Date(data.generatedAt).toLocaleString()}</p>
    </section>
  );
}
