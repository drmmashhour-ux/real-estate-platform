import type { LegalFraudEngineSummary } from "@/modules/legal/legal-fraud-engine.service";

export function LegalFraudEngineSummaryCard({ summary }: { summary: LegalFraudEngineSummary | null }) {
  if (!summary) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-[#111] p-3 text-xs text-zinc-500">No summary available.</div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-[#111] p-4 text-xs">
      <h3 className="font-semibold text-zinc-200">Operational indicators</h3>
      <dl className="mt-3 grid grid-cols-2 gap-3 text-zinc-400 md:grid-cols-4">
        <div>
          <dt className="text-zinc-600">Signals</dt>
          <dd className="font-mono text-zinc-200">{summary.signalCount}</dd>
        </div>
        <div>
          <dt className="text-zinc-600">Indicators</dt>
          <dd className="font-mono text-zinc-200">{summary.indicatorCount}</dd>
        </div>
        <div>
          <dt className="text-zinc-600">Critical</dt>
          <dd className="font-mono text-amber-200">{summary.countsBySeverity.critical}</dd>
        </div>
        <div>
          <dt className="text-zinc-600">Warning</dt>
          <dd className="font-mono text-zinc-200">{summary.countsBySeverity.warning}</dd>
        </div>
      </dl>
      <p className="mt-3 text-[10px] text-zinc-600">
        Indicator-based review signals — not determinations of wrongdoing.
      </p>
    </div>
  );
}
