import type { GrowthDashboardSummary } from "@/modules/growth-intelligence/growth.types";

export function GrowthIntelligenceSummaryCard(props: {
  summary: GrowthDashboardSummary | null;
  disabled?: boolean;
}) {
  const { summary, disabled } = props;
  if (disabled || !summary) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/30 p-5 text-sm text-zinc-400">
        Growth Intelligence is off or snapshot unavailable. Enable FEATURE_GROWTH_INTELLIGENCE_V1.
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-premium-gold/25 bg-black/40 p-5 shadow-[inset_0_1px_0_0_rgba(212,175,55,0.06)]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-premium-gold">Growth Intelligence</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div>
          <p className="text-[11px] uppercase text-zinc-500">Snapshot</p>
          <p className="font-mono text-xs text-zinc-200">{summary.snapshotId.slice(0, 24)}…</p>
        </div>
        <div>
          <p className="text-[11px] uppercase text-zinc-500">Signal kinds</p>
          <p className="text-lg font-semibold text-white">{Object.keys(summary.signalCountsByType ?? {}).length}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase text-zinc-500">Opportunity kinds</p>
          <p className="text-lg font-semibold text-white">{Object.keys(summary.opportunityCountsByType ?? {}).length}</p>
        </div>
      </div>
      {summary.availabilityNotes?.length ? (
        <ul className="mt-4 list-inside list-disc text-xs text-zinc-500">
          {summary.availabilityNotes.slice(0, 6).map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
