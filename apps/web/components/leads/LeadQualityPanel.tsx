"use client";

import type { LeadQualitySummary } from "@/modules/leads/lead-quality.types";

function barClass(score: number): string {
  if (score >= 72) return "bg-emerald-500/80";
  if (score >= 45) return "bg-amber-500/70";
  return "bg-slate-600/80";
}

export function LeadQualityPanel({ summary }: { summary: LeadQualitySummary }) {
  const { breakdown, band, score, strongSignals, weakSignals, suggestedPrice } = summary;
  const rows: { label: string; value: number }[] = [
    { label: "Completeness", value: breakdown.completenessScore },
    { label: "Intent", value: breakdown.intentScore },
    { label: "Budget / value signals", value: breakdown.budgetScore },
    { label: "Urgency", value: breakdown.urgencyScore },
    { label: "Engagement", value: breakdown.engagementScore },
  ];

  return (
    <section className="rounded-2xl border border-white/10 bg-[#121212] p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-premium-gold">Lead quality (V1)</p>
      <p className="mt-1 text-[11px] text-[#737373]">
        Rule-based, deterministic — advisory suggested price does not replace unlock pricing.
      </p>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-3xl font-bold tabular-nums text-white">{score}</p>
          <p className="text-xs uppercase tracking-wide text-[#B3B3B3]">
            Band: <span className="font-semibold text-premium-gold">{band}</span>
          </p>
        </div>
        <div className="rounded-lg border border-premium-gold/30 bg-[#1a1508] px-3 py-2 text-right">
          <p className="text-[10px] uppercase text-[#737373]">Suggested price (advisory)</p>
          <p className="text-lg font-bold tabular-nums text-premium-gold">
            ${suggestedPrice.toLocaleString()} <span className="text-xs font-normal text-[#737373]">CAD</span>
          </p>
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {rows.map((r) => (
          <li key={r.label}>
            <div className="mb-0.5 flex justify-between text-[11px] text-[#B3B3B3]">
              <span>{r.label}</span>
              <span className="tabular-nums text-white">{r.value}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full transition-all ${barClass(r.value)}`}
                style={{ width: `${Math.min(100, Math.max(0, r.value))}%` }}
              />
            </div>
          </li>
        ))}
      </ul>

      {strongSignals.length > 0 ? (
        <div className="mt-4">
          <p className="text-[10px] font-semibold uppercase text-emerald-400/90">Strong signals</p>
          <ul className="mt-1 list-inside list-disc text-xs text-[#B3B3B3]">
            {strongSignals.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {weakSignals.length > 0 ? (
        <div className="mt-3">
          <p className="text-[10px] font-semibold uppercase text-amber-400/90">Weak signals</p>
          <ul className="mt-1 list-inside list-disc text-xs text-[#737373]">
            {weakSignals.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
