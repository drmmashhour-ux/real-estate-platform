"use client";

import type { BNHubListingConversionSummaryV1 } from "@/modules/bnhub/conversion/bnhub-guest-conversion.types";

function pct(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return `${(n * 100).toFixed(1)}%`;
}

/**
 * BNHub guest conversion funnel (V1) — advisory metrics for hosts.
 */
export function HostConversionPanel({ summary }: { summary: BNHubListingConversionSummaryV1 }) {
  const m = summary.metrics;
  return (
    <div className="mt-4 rounded-xl border border-sky-500/25 bg-sky-500/5 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-sky-300/90">Guest conversion (V1)</p>
      <p className="mt-1 text-[10px] text-neutral-500">Advisory funnel — no automatic listing or price changes.</p>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Metric label="Impressions (search ctx.)" value={String(m.impressions)} />
        <Metric label="Clicks" value={String(m.clicks)} />
        <Metric label="Listing views" value={String(m.views)} />
        <Metric label="Booking starts" value={String(m.bookingStarts)} />
        <Metric label="Paid completions" value={String(m.bookingsCompleted)} />
        <Metric label="CTR" value={pct(m.ctr)} />
        <Metric label="View rate" value={pct(m.viewRate)} />
        <Metric label="Booking rate" value={pct(m.bookingRate)} />
      </div>

      {summary.insights.length > 0 ? (
        <div className="mt-4 border-t border-white/10 pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-200/90">Insights</p>
          <ul className="mt-2 space-y-2">
            {summary.insights.map((i) => (
              <li key={i.id} className="text-xs text-neutral-300">
                <span className="font-semibold text-white">{i.title}</span>
                <span className={`ml-2 text-[10px] uppercase text-neutral-500`}>({i.severity})</span>
                <p className="mt-0.5 text-[11px] text-neutral-500">{i.description}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {summary.recommendations.length > 0 ? (
        <div className="mt-4 border-t border-white/10 pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-200/90">Top actions</p>
          <ol className="mt-2 list-decimal space-y-1 pl-4 text-[11px] text-neutral-300">
            {summary.recommendations.map((r, idx) => (
              <li key={idx}>{r}</li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 px-2 py-1.5">
      <p className="text-[9px] uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-0.5 font-mono text-sm tabular-nums text-neutral-100">{value}</p>
    </div>
  );
}
