"use client";

import type { LeadMonetizationControlSummary } from "@/modules/leads/lead-monetization-control.types";

function modeLabel(mode: LeadMonetizationControlSummary["priceSourceMode"]): string {
  switch (mode) {
    case "dynamic_advisory":
      return "Dynamic advisory (primary)";
    case "quality_advisory":
      return "Quality advisory (fallback)";
    default:
      return "Base reference only";
  }
}

function confidenceLabel(c: LeadMonetizationControlSummary["confidenceLevel"]): string {
  return c.charAt(0).toUpperCase() + c.slice(1);
}

export function LeadMonetizationControlPanel({ summary }: { summary: LeadMonetizationControlSummary }) {
  return (
    <section className="rounded-2xl border border-emerald-500/30 bg-[#0d1a14] p-5 shadow-[0_0_0_1px_rgba(16,185,129,0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300/90">Operator</p>
          <h2 className="mt-1 text-lg font-semibold text-white">Lead monetization control</h2>
          <p className="mt-1 max-w-2xl text-xs text-slate-400">
            Advisory readout only — does not change Stripe, checkout, or submission flows. Suggested figures are not
            auto-applied.
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-right text-xs">
          <p className="text-slate-500">Confidence</p>
          <p className="font-semibold text-emerald-200">{confidenceLabel(summary.confidenceLevel)}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-black/25 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Base price</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-white">
            ${summary.basePrice.toLocaleString()}{" "}
            <span className="text-xs font-normal text-slate-500">CAD</span>
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Revenue engine reference (unchanged).</p>
        </div>
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-950/20 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-200/90">
            Suggested price (advisory)
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-100">
            ${summary.suggestedPrice.toLocaleString()}{" "}
            <span className="text-xs font-normal text-slate-500">CAD</span>
          </p>
          <p className="mt-1 text-[11px] text-emerald-200/70">{modeLabel(summary.priceSourceMode)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/25 p-4 text-xs text-slate-300">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Signals</p>
          {summary.demandLevel ? (
            <p className="mt-1">
              Demand: <span className="font-medium text-white">{summary.demandLevel}</span>
              {typeof summary.demandScore === "number" ? (
                <span className="text-slate-500"> ({summary.demandScore})</span>
              ) : null}
            </p>
          ) : null}
          {typeof summary.brokerInterestLevel === "number" ? (
            <p className="mt-1">
              Broker interest: <span className="font-medium text-white">{summary.brokerInterestLevel}</span>/100
            </p>
          ) : null}
          {summary.qualityBand ? (
            <p className="mt-1">
              Quality: <span className="font-medium text-white">{summary.qualityBand}</span>
              {typeof summary.qualityScore === "number" ? (
                <span className="text-slate-500"> ({summary.qualityScore})</span>
              ) : null}
            </p>
          ) : null}
        </div>
      </div>

      <p className="mt-4 rounded-lg border border-white/10 bg-black/20 p-3 text-sm leading-relaxed text-slate-300">
        {summary.explanation}
      </p>

      {summary.reasons.length > 0 ? (
        <ul className="mt-4 space-y-2 text-xs text-slate-300">
          {summary.reasons.map((r, i) => (
            <li key={`${r.type}-${i}`} className="flex gap-2">
              <span className="shrink-0 rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
                {r.type}
              </span>
              <span>
                <span className="font-medium text-slate-200">{r.label}.</span> {r.description}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {(summary.warnings.length > 0 || summary.missingSignals.length > 0) && (
        <div className="mt-4 space-y-2 text-xs">
          {summary.warnings.map((w) => (
            <p key={w} className="rounded border border-amber-500/30 bg-amber-950/25 px-3 py-2 text-amber-100/95">
              {w}
            </p>
          ))}
          {summary.missingSignals.length > 0 ? (
            <div className="rounded border border-slate-600/40 bg-slate-950/50 px-3 py-2 text-slate-400">
              <p className="font-semibold text-slate-300">Missing / thin signals</p>
              <ul className="mt-1 list-inside list-disc">
                {summary.missingSignals.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
