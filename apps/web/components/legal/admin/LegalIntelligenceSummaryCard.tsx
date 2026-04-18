import type { LegalIntelligenceSummary } from "@/modules/legal/legal-intelligence.types";

export function LegalIntelligenceSummaryCard({ summary }: { summary: LegalIntelligenceSummary | null }) {
  if (!summary) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
        <p className="text-xs text-slate-500">No scoped summary — enable Legal Intelligence V1 or select a listing.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-premium-gold">Summary</p>
      <dl className="mt-3 grid gap-3 text-xs sm:grid-cols-3">
        <div>
          <dt className="text-slate-500">Critical</dt>
          <dd className="font-mono text-red-300">{summary.countsBySeverity.critical}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Warning</dt>
          <dd className="font-mono text-amber-200">{summary.countsBySeverity.warning}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Info</dt>
          <dd className="font-mono text-slate-300">{summary.countsBySeverity.info}</dd>
        </div>
      </dl>
      <p className="mt-3 text-[11px] leading-relaxed text-slate-500">{summary.freshnessNote}</p>
    </div>
  );
}
