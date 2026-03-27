import type { FutureOutcomeRiskItem } from "@/src/modules/future-outcome-simulator/domain/futureOutcome.types";

const sourceLabel: Record<FutureOutcomeRiskItem["source"], string> = {
  scenario: "Scenario model",
  case_file: "Case file",
  combined: "Case + scenario",
};

export function RiskPreview({ risks, compact }: { risks: FutureOutcomeRiskItem[]; compact?: boolean }) {
  if (!risks.length) return <p className="text-xs text-slate-500">No extra risks listed for this illustration.</p>;
  const show = compact ? risks.slice(0, 4) : risks;
  return (
    <ul className="space-y-2">
      {show.map((r) => (
        <li key={r.id} className="rounded-lg border border-rose-500/15 bg-rose-950/10 px-3 py-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-rose-100/95">{r.title}</p>
            <span className="text-[9px] uppercase tracking-wide text-rose-200/50">{sourceLabel[r.source]}</span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">{r.detail}</p>
        </li>
      ))}
    </ul>
  );
}
