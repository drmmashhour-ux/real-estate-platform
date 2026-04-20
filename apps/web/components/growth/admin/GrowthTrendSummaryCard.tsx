import type { GrowthTrendSummary } from "@/modules/growth-intelligence/growth.types";

export function GrowthTrendSummaryCard(props: { trends: GrowthTrendSummary }) {
  const { trends } = props;
  const hasSignals = trends.trendSignalCount > 0 || trends.stalledFunnelHints > 0 || trends.repeatDropoffHints > 0;

  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-xs text-zinc-400">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-premium-gold">Timeline trends</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <div className="rounded-lg border border-white/5 bg-black/40 px-3 py-2">
          <p className="text-[10px] uppercase text-zinc-500">Timeline signals</p>
          <p className="text-lg font-semibold text-white">{trends.trendSignalCount}</p>
        </div>
        <div className="rounded-lg border border-white/5 bg-black/40 px-3 py-2">
          <p className="text-[10px] uppercase text-zinc-500">Stalled workflows</p>
          <p className="text-lg font-semibold text-white">{trends.stalledFunnelHints}</p>
        </div>
        <div className="rounded-lg border border-white/5 bg-black/40 px-3 py-2">
          <p className="text-[10px] uppercase text-zinc-500">Repeat drop-offs</p>
          <p className="text-lg font-semibold text-white">{trends.repeatDropoffHints}</p>
        </div>
      </div>
      <p className="mt-3 text-[11px] text-zinc-500">
        Windows: {trends.timelineWindowsCompared.join(", ") || "—"}
      </p>
      {!hasSignals ? (
        <p className="mt-2 text-[11px] text-zinc-600">
          Requires append-only EventRecord aggregates and FEATURE_EVENT_TIMELINE_V1 — otherwise counts stay at zero.
        </p>
      ) : null}
      <ul className="mt-3 list-inside list-disc space-y-1 text-zinc-500">
        {trends.notes.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
    </div>
  );
}
