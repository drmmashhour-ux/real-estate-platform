"use client";

export type GrowthForecastPanelProps = {
  monthlyTargetCad: number;
  currentRevenueCad: number;
  progressPercent: number;
  projectedMonthEndCad: number;
  dailyRunRateCad: number;
  utcDayOfMonth: number;
  utcDaysInMonth: number;
};

function fmtCad(n: number): string {
  return n.toLocaleString("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });
}

export function GrowthForecastPanel(f: GrowthForecastPanelProps) {
  return (
    <section className="rounded-xl border border-fuchsia-900/40 bg-fuchsia-950/15 p-4" data-growth-forecast-panel-v1>
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-fuchsia-300/90">$10K scale · Forecast</p>
      <h3 className="mt-1 text-lg font-semibold text-zinc-100">Revenue forecast</h3>
      <p className="mt-2 text-sm text-zinc-400">
        Month-to-date: <strong className="text-white">{fmtCad(f.currentRevenueCad)}</strong> · Target{" "}
        {fmtCad(f.monthlyTargetCad)} · Progress {f.progressPercent.toFixed(1)}%
      </p>
      <p className="mt-2 text-sm text-fuchsia-100/90">
        Run-rate projection (UTC month): <strong>{fmtCad(f.projectedMonthEndCad)}</strong> · ~{fmtCad(f.dailyRunRateCad)}{" "}
        / day (days {f.utcDayOfMonth}/{f.utcDaysInMonth})
      </p>
      <p className="mt-2 text-[11px] text-zinc-500">Advisory linear projection — not a guarantee.</p>
    </section>
  );
}
