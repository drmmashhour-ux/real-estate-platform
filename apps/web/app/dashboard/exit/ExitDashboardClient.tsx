"use client";

import { useMemo, useState } from "react";
import {
  ACQUISITION,
  EXIT_TYPE_LABELS,
  IPO,
  evaluateExit,
  type CompanyMetrics,
  type ExitRecommendation,
  type Score1to5,
} from "@/modules/exit";

function recLabel(r: ExitRecommendation): string {
  if (r === ACQUISITION) return EXIT_TYPE_LABELS[ACQUISITION];
  if (r === IPO) return EXIT_TYPE_LABELS[IPO];
  if (r === "EITHER") return "Parallel preparation (either path)";
  return "Need more baseline data";
}

function ScoreSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Score1to5;
  onChange: (v: Score1to5) => void;
}) {
  return (
    <label className="block text-xs text-zinc-500">
      {label}
      <select
        className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-white"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) as Score1to5)}
      >
        <option value={0}>Not scored</option>
        {[1, 2, 3, 4, 5].map((n) => (
          <option key={n} value={n}>
            {n} — {n <= 2 ? "early" : n === 3 ? "developing" : "strong"}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ExitDashboardClient() {
  const [metrics, setMetrics] = useState<CompanyMetrics>({
    currency: "USD",
    annualRevenue: 45_000_000,
    revenueGrowthYoy: 0.28,
    profitability: { ebitdaMargin: 0.14, netMargin: null },
    marketPresence: { normalizedScore: 0.45, summary: "National footprint; category #3–5" },
    readiness: {
      acquisition: { strategicValue: 3, buyerInterest: 2, integrationEase: 3 },
      ipo: { governanceMaturity: 2, financialReportingMaturity: 2, resultsConsistency: 3 },
    },
    notes: "",
  });

  const result = useMemo(() => evaluateExit(metrics), [metrics]);

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-8 text-zinc-100">
      <header className="space-y-3 border-b border-[#D4AF37]/25 pb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#D4AF37]/90">Exit planning</p>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Acquisition vs IPO readiness</h1>
        <div className="rounded-lg border border-[#D4AF37]/30 bg-[#1a1508] px-4 py-3 text-sm text-[#f5e6c8]">
          <strong className="text-[#D4AF37]">No guarantees.</strong> This view scores{" "}
          <em>readiness themes</em> from your inputs — not valuations, timelines, listing eligibility, or success odds.
          Decisions belong with your board and qualified advisors.
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 lg:col-span-2">
          <h2 className="text-lg font-medium text-[#D4AF37]">Company metrics</h2>
          <p className="mt-1 text-xs text-zinc-500">Use audited or management numbers you are willing to stand behind in a process.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-xs text-zinc-500">
              Currency
              <input
                className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                value={metrics.currency}
                onChange={(e) =>
                  setMetrics((m) => ({ ...m, currency: e.target.value.toUpperCase().slice(0, 3) }))
                }
              />
            </label>
            <label className="text-xs text-zinc-500">
              LTM revenue
              <input
                type="number"
                className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                value={metrics.annualRevenue}
                onChange={(e) =>
                  setMetrics((m) => ({ ...m, annualRevenue: Math.max(0, Number(e.target.value)) }))
                }
              />
            </label>
            <label className="text-xs text-zinc-500">
              YoY revenue growth (decimal, e.g. 0.3 = 30%)
              <input
                type="number"
                step={0.01}
                className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                value={metrics.revenueGrowthYoy ?? ""}
                placeholder="optional"
                onChange={(e) =>
                  setMetrics((m) => ({
                    ...m,
                    revenueGrowthYoy: e.target.value === "" ? null : Number(e.target.value),
                  }))
                }
              />
            </label>
            <label className="text-xs text-zinc-500">
              EBITDA margin (decimal)
              <input
                type="number"
                step={0.01}
                className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                value={metrics.profitability?.ebitdaMargin ?? ""}
                placeholder="optional"
                onChange={(e) =>
                  setMetrics((m) => ({
                    ...m,
                    profitability: {
                      ...m.profitability,
                      ebitdaMargin: e.target.value === "" ? null : Number(e.target.value),
                      netMargin: m.profitability?.netMargin ?? null,
                    },
                  }))
                }
              />
            </label>
            <label className="text-xs text-zinc-500 sm:col-span-2">
              Market presence (0–1 normalized)
              <input
                type="number"
                step={0.05}
                min={0}
                max={1}
                className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                value={metrics.marketPresence.normalizedScore}
                onChange={(e) =>
                  setMetrics((m) => ({
                    ...m,
                    marketPresence: {
                      ...m.marketPresence,
                      normalizedScore: Math.min(1, Math.max(0, Number(e.target.value))),
                    },
                  }))
                }
              />
            </label>
            <label className="text-xs text-zinc-500 sm:col-span-2">
              Market presence notes
              <input
                className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                value={metrics.marketPresence.summary ?? ""}
                onChange={(e) =>
                  setMetrics((m) => ({
                    ...m,
                    marketPresence: { ...m.marketPresence, summary: e.target.value },
                  }))
                }
              />
            </label>
            <label className="text-xs text-zinc-500 sm:col-span-2">
              Notes (optional)
              <textarea
                className="mt-1 min-h-[72px] w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                value={metrics.notes ?? ""}
                onChange={(e) => setMetrics((m) => ({ ...m, notes: e.target.value }))}
              />
            </label>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <h3 className="text-sm font-semibold text-white">Suggestion (heuristic)</h3>
            <p className="mt-3 text-2xl font-semibold text-[#D4AF37]">{recLabel(result.recommendation)}</p>
            <p className="mt-2 text-xs text-zinc-500">
              Data completeness: <span className="text-zinc-300">{result.dataCompleteness}</span>
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-4 text-sm text-zinc-400">
              {result.reasoning.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 text-xs text-zinc-500">
            <p className="font-semibold text-zinc-300">Metric highlights</p>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              {result.metricAnalysis.highlights.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
          <h2 className="text-lg font-medium text-[#D4AF37]">{EXIT_TYPE_LABELS[ACQUISITION]} readiness</h2>
          <p className="mt-1 text-xs text-zinc-500">Strategic value, buyer interest, integration feasibility (1–5 self-scores).</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <ScoreSelect
              label="Strategic value"
              value={metrics.readiness?.acquisition?.strategicValue ?? 0}
              onChange={(v) =>
                setReadiness({
                  acquisition: { ...metrics.readiness?.acquisition, strategicValue: v },
                })
              }
            />
            <ScoreSelect
              label="Buyer interest"
              value={metrics.readiness?.acquisition?.buyerInterest ?? 0}
              onChange={(v) =>
                setReadiness({
                  acquisition: { ...metrics.readiness?.acquisition, buyerInterest: v },
                })
              }
            />
            <ScoreSelect
              label="Integration ease"
              value={metrics.readiness?.acquisition?.integrationEase ?? 0}
              onChange={(v) =>
                setReadiness({
                  acquisition: { ...metrics.readiness?.acquisition, integrationEase: v },
                })
              }
            />
          </div>
          <p className="mt-4 text-sm text-zinc-400">
            Overall:{" "}
            <span className="font-semibold tabular-nums text-white">{result.acquisition.overallScore}</span> / 100
          </p>
          <div className="mt-4 space-y-4">
            {result.acquisition.dimensions.map((d) => (
              <div key={d.id}>
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>{d.label}</span>
                  <span className="tabular-nums text-[#D4AF37]">{d.score}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-zinc-800">
                  <div className="h-full rounded-full bg-[#D4AF37]/70" style={{ width: `${d.score}%` }} />
                </div>
                <p className="mt-1 text-[11px] text-zinc-500">{d.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
          <h2 className="text-lg font-medium text-[#D4AF37]">{EXIT_TYPE_LABELS[IPO]} readiness</h2>
          <p className="mt-1 text-xs text-zinc-500">Scale, consistency, governance & reporting maturity.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <ScoreSelect
              label="Governance maturity"
              value={metrics.readiness?.ipo?.governanceMaturity ?? 0}
              onChange={(v) =>
                setMetrics((m) => ({
                  ...m,
                  readiness: {
                    ...m.readiness,
                    ipo: { ...m.readiness?.ipo, governanceMaturity: v },
                  },
                }))
              }
            />
            <ScoreSelect
              label="Financial reporting"
              value={metrics.readiness?.ipo?.financialReportingMaturity ?? 0}
              onChange={(v) =>
                setMetrics((m) => ({
                  ...m,
                  readiness: {
                    ...m.readiness,
                    ipo: { ...m.readiness?.ipo, financialReportingMaturity: v },
                  },
                }))
              }
            />
            <ScoreSelect
              label="Results consistency"
              value={metrics.readiness?.ipo?.resultsConsistency ?? 0}
              onChange={(v) =>
                setMetrics((m) => ({
                  ...m,
                  readiness: {
                    ...m.readiness,
                    ipo: { ...m.readiness?.ipo, resultsConsistency: v },
                  },
                }))
              }
            />
          </div>
          <p className="mt-4 text-sm text-zinc-400">
            Overall: <span className="font-semibold tabular-nums text-white">{result.ipo.overallScore}</span> / 100
          </p>
          <div className="mt-4 space-y-4">
            {result.ipo.dimensions.map((d) => (
              <div key={d.id}>
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>{d.label}</span>
                  <span className="tabular-nums text-[#D4AF37]">{d.score}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-zinc-800">
                  <div className="h-full rounded-full bg-[#D4AF37]/70" style={{ width: `${d.score}%` }} />
                </div>
                <p className="mt-1 text-[11px] text-zinc-500">{d.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
        <h2 className="text-lg font-medium text-[#D4AF37]">Gaps to tighten the analysis</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-zinc-400">
          {result.gaps.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
        <h2 className="text-lg font-medium text-[#D4AF37]">Risks by path (non-exhaustive)</h2>
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          {result.risks.map((block) => (
            <div key={block.path} className="rounded-lg border border-zinc-800 bg-black/30 p-4">
              <p className="text-sm font-semibold text-white">{EXIT_TYPE_LABELS[block.path]}</p>
              <ul className="mt-3 space-y-3 text-sm text-zinc-400">
                {block.risks.map((r) => (
                  <li key={r.title}>
                    <span className="text-zinc-200">{r.title}.</span> {r.detail}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
