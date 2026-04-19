"use client";

import type { InternalLeadPricingDisplayResult } from "@/modules/leads/lead-pricing-display.service";
import type { LeadPricingComparisonSummary } from "@/modules/leads/lead-pricing-experiments.types";

function precedenceLabel(mode: LeadPricingComparisonSummary["selectedDisplayMode"]): string {
  switch (mode) {
    case "operator_override":
      return "Active operator override (internal)";
    case "monetization_primary":
      return "Monetization primary suggestion";
    default:
      return "Base reference fallback";
  }
}

function confidenceLabel(c: LeadPricingComparisonSummary["experimentResults"][number]["confidenceLevel"]): string {
  return c.charAt(0).toUpperCase() + c.slice(1);
}

export function LeadPricingExperimentsPanel({
  comparison,
  internalDisplay,
}: {
  comparison: LeadPricingComparisonSummary;
  internalDisplay?: InternalLeadPricingDisplayResult | null;
}) {
  return (
    <section className="mt-6 rounded-2xl border border-sky-500/30 bg-[#0c1520] p-5 shadow-[0_0_0_1px_rgba(14,165,233,0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-300/90">Operator</p>
          <h2 className="mt-1 text-lg font-semibold text-white">Lead pricing experiments</h2>
          <p className="mt-1 max-w-2xl text-xs text-slate-400">
            Advisory-only lanes — compare weightings without publishing prices or changing Stripe, checkout, or unlock
            flows.
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-right text-xs text-slate-300">
          <p className="font-semibold text-sky-200">Display precedence</p>
          <p className="mt-0.5 text-[11px] text-slate-400">{precedenceLabel(comparison.selectedDisplayMode)}</p>
        </div>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-slate-400">{comparison.explanation}</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-black/25 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Base price</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-white">
            ${comparison.basePrice.toLocaleString()} <span className="text-xs font-normal text-slate-500">CAD</span>
          </p>
        </div>
        <div className="rounded-xl border border-sky-500/25 bg-sky-950/25 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-sky-200/90">Primary suggested</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-sky-100">
            ${comparison.primarySuggestedPrice.toLocaleString()}{" "}
            <span className="text-xs font-normal text-slate-500">CAD</span>
          </p>
          <p className="mt-1 text-[11px] text-slate-500">From monetization control layer (not live pricing).</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/25 p-4 text-xs text-slate-300">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Internal advisory price</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-white">
            $
            {(internalDisplay?.effectiveAdvisoryPrice ??
              (comparison.activeOverride?.status === "active"
                ? comparison.activeOverride.overridePrice
                : comparison.primarySuggestedPrice)
            ).toLocaleString()}{" "}
            CAD
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Uses display precedence — does not mutate unlock prices automatically.
          </p>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-white/10 text-[10px] uppercase tracking-wide text-slate-500">
              <th className="py-2 pr-3">Mode</th>
              <th className="py-2 pr-3">Suggested</th>
              <th className="py-2 pr-3">Δ from base</th>
              <th className="py-2 pr-3">Confidence</th>
              <th className="py-2">Notes</th>
            </tr>
          </thead>
          <tbody>
            {comparison.experimentResults.map((row) => (
              <tr key={row.mode} className="border-b border-white/5 align-top text-slate-200">
                <td className="py-3 pr-3 font-mono text-[11px] text-sky-100">{row.mode}</td>
                <td className="py-3 pr-3 tabular-nums">${row.suggestedPrice.toLocaleString()}</td>
                <td className="py-3 pr-3 tabular-nums text-slate-400">
                  {row.deltaFromBase >= 0 ? "+" : ""}
                  {row.deltaFromBase}
                </td>
                <td className="py-3 pr-3">{confidenceLabel(row.confidenceLevel)}</td>
                <td className="py-3">
                  <ul className="list-inside list-disc space-y-1 text-[11px] text-slate-400">
                    {row.reasons.map((r) => (
                      <li key={r.slice(0, 80)}>{r}</li>
                    ))}
                  </ul>
                  {row.warnings.length > 0 ? (
                    <ul className="mt-2 list-inside list-disc space-y-1 text-[11px] text-amber-200/90">
                      {row.warnings.map((w) => (
                        <li key={w.slice(0, 80)}>{w}</li>
                      ))}
                    </ul>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
