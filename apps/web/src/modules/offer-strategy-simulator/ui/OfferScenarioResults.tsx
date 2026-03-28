"use client";

import type { ImpactVector, OfferSimulationResult } from "@/src/modules/offer-strategy-simulator/domain/offerStrategy.types";
import { impactBandClasses } from "@/src/modules/offer-strategy-simulator/ui/offerScenarioUiUtils";

function ImpactCard({ title, v }: { title: string; v: ImpactVector }) {
  const c = impactBandClasses(v.band);
  return (
    <div className={`rounded-xl border border-white/10 ${c.bg} p-3 ring-1 ${c.ring}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{title}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${c.text}`}>{v.score}</p>
      <p className="mt-1 text-[11px] leading-snug text-slate-400">{v.summary}</p>
      <p className="mt-2 text-[10px] uppercase tracking-wide text-slate-500">Band: {v.band}</p>
    </div>
  );
}

export function OfferScenarioResults({
  result,
  compact,
}: {
  result: OfferSimulationResult;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="space-y-2 text-xs">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-white/10 bg-[#121212] p-2">
            <p className="text-[9px] uppercase text-slate-500">Deal</p>
            <p className="text-lg font-semibold text-slate-100">{result.dealImpact.score}</p>
            <p className="text-[10px] text-slate-500">{result.dealImpact.band}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-[#121212] p-2">
            <p className="text-[9px] uppercase text-slate-500">Leverage</p>
            <p className="text-lg font-semibold text-slate-100">{result.leverageImpact.score}</p>
            <p className="text-[10px] text-slate-500">{result.leverageImpact.band}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-[#121212] p-2">
            <p className="text-[9px] uppercase text-slate-500">Risk</p>
            <p className="text-lg font-semibold text-slate-100">{result.riskImpact.score}</p>
            <p className="text-[10px] text-slate-500">{result.riskImpact.band}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-[#121212] p-2">
            <p className="text-[9px] uppercase text-slate-500">Readiness</p>
            <p className="text-lg font-semibold text-slate-100">{result.readinessImpact.score}</p>
            <p className="text-[10px] text-slate-500">{result.readinessImpact.band}</p>
          </div>
        </div>
        <p className="line-clamp-4 text-[11px] leading-snug text-slate-400">{result.recommendedStrategy}</p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ImpactCard title="Deal impact" v={result.dealImpact} />
        <ImpactCard title="Leverage impact" v={result.leverageImpact} />
        <ImpactCard title="Risk impact" v={result.riskImpact} />
        <ImpactCard title="Readiness impact" v={result.readinessImpact} />
      </div>
      <div className="rounded-xl border border-white/10 bg-[#121212] p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-premium-gold">Recommended strategy (illustrative)</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-200">{result.recommendedStrategy}</p>
        <p className="mt-3 text-xs text-slate-500">Confidence: {result.confidence}</p>
      </div>
      <div className="rounded-lg border border-white/5 bg-black/40 p-3 text-xs leading-relaxed text-slate-500">{result.disclaimer}</div>
    </div>
  );
}
