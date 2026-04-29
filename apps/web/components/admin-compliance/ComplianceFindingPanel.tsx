import type { ComplianceCaseView, ComplianceFindingView } from "@/types/compliance-cases-client";

type CaseRow = ComplianceCaseView & {
  complianceFindings: ComplianceFindingView[];
  deal: { id: string; dealCode: string | null; status: string; brokerId: string | null } | null;
};

export function ComplianceFindingPanel({ caseRow }: { caseRow: CaseRow }) {
  return (
    <div className="rounded-xl border border-amber-500/15 bg-black/40 p-4">
      <p className="text-xs uppercase tracking-[0.15em] text-amber-500/80">Case</p>
      <p className="mt-1 text-sm text-zinc-200">{caseRow.summary}</p>
      <ul className="mt-4 space-y-3">
        {caseRow.complianceFindings.map((f) => {
          const meta = f.metadata as { reasons?: string[]; suggestedActions?: string[]; ruleKey?: string } | null;
          return (
            <li key={f.id} className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-zinc-100">{f.title}</p>
                <span className="shrink-0 text-[10px] uppercase text-zinc-500">{f.severity}</span>
              </div>
              <p className="mt-1 text-xs text-zinc-400">{f.summary}</p>
              {meta?.ruleKey && (
                <p className="mt-2 font-mono text-[10px] text-zinc-600">
                  Rule: <span className="text-zinc-400">{meta.ruleKey}</span>
                </p>
              )}
              {meta?.reasons && meta.reasons.length > 0 && (
                <ul className="mt-2 list-inside list-disc text-xs text-zinc-500">
                  {meta.reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              )}
              {meta?.suggestedActions && meta.suggestedActions.length > 0 && (
                <ul className="mt-2 text-xs text-amber-200/70">
                  {meta.suggestedActions.map((a, i) => (
                    <li key={i}>→ {a}</li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
