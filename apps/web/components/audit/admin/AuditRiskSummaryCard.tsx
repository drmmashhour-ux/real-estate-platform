export function AuditRiskSummaryCard({ summary }: { summary: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-[#111] p-3 text-xs text-zinc-400">
      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Risk / anomaly summary</h3>
      <p className="mt-2 leading-relaxed">{summary}</p>
    </div>
  );
}
