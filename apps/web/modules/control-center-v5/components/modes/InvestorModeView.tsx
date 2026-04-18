"use client";

import type { InvestorModeView as InvestorData } from "../../company-command-center-v5.types";
import { ModeHeroSummary } from "../shared/ModeHeroSummary";

export function InvestorModeView({ view }: { view: InvestorData }) {
  return (
    <div className="space-y-6">
      <ModeHeroSummary text={view.companySummary} />
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h4 className="text-[10px] font-semibold uppercase text-emerald-200/70">Growth signals (reported)</h4>
          <ul className="mt-2 space-y-1 text-xs text-zinc-300">
            {(view.growthSignals.length ? view.growthSignals : ["—"]).map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-[10px] font-semibold uppercase text-zinc-400">Stability</h4>
          <ul className="mt-2 space-y-1 text-xs text-zinc-400">
            {(view.stabilitySignals.length ? view.stabilitySignals : ["—"]).map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </div>
      </div>
      <div>
        <h4 className="text-[10px] font-semibold uppercase text-zinc-500">Moat / differentiation (observed)</h4>
        <ul className="mt-2 space-y-1 text-xs text-zinc-400">
          {(view.moatSignals.length ? view.moatSignals : ["—"]).map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
      </div>
      <div>
        <h4 className="text-[10px] font-semibold uppercase text-zinc-500">Top metrics</h4>
        <ul className="mt-2 space-y-1 text-[11px] text-zinc-400">
          {Object.entries(view.topMetrics).map(([k, v]) => (
            <li key={k}>
              {k}: {v}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h4 className="text-[10px] font-semibold uppercase text-rose-200/70">Strategic risks (from governance)</h4>
        <ul className="mt-2 space-y-1 text-xs text-zinc-300">
          {(view.strategicRisks.length ? view.strategicRisks : ["—"]).map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
      </div>
      <div>
        <h4 className="text-[10px] font-semibold uppercase text-zinc-500">Progress narrative</h4>
        <ul className="mt-2 space-y-1 text-xs text-zinc-400">
          {(view.progressNarrative.length ? view.progressNarrative : ["—"]).map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
