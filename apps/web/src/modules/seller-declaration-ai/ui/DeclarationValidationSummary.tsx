import type { DeclarationValidationResult } from "@/src/modules/seller-declaration-ai/domain/declaration.types";

type Props = {
  validation: DeclarationValidationResult | null;
  onReadyForReview: () => void;
};

export function DeclarationValidationSummary({ validation, onReadyForReview }: Props) {
  if (!validation) return <p className="text-xs text-slate-500">Validation has not run yet.</p>;

  return (
    <div className="space-y-3 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-slate-200">Completion: <span className="font-semibold">{validation.completenessPercent}%</span></p>
        <button
          type="button"
          className="rounded-lg bg-[#C9A646] px-3 py-1.5 text-xs font-medium text-black disabled:opacity-50"
          disabled={!validation.isValid}
          onClick={onReadyForReview}
        >
          Ready for review
        </button>
      </div>

      {validation.knowledgeRuleBlocks?.length ? (
        <p className="text-rose-200">Blocking (rules): {validation.knowledgeRuleBlocks.join(" | ")}</p>
      ) : null}
      {validation.missingFields.length ? <p className="text-amber-200">Missing fields: {validation.missingFields.join(", ")}</p> : <p className="text-emerald-200">No required field gaps.</p>}
      {validation.warningFlags.length ? <p className="text-amber-100">Warnings: {validation.warningFlags.join(" | ")}</p> : null}
      {validation.knowledgeRiskHints?.length ? (
        <div className="rounded-md border border-white/10 bg-white/5 p-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Sources from uploaded books</p>
          <ul className="mt-1 space-y-1 text-slate-300">
            {validation.knowledgeRiskHints.map((h, i) => (
              <li key={`${h.sourceTitle}-${i}`}>
                <span className="text-amber-200/90">{h.sourceTitle}</span>
                {h.pageNumber != null ? ` · p.${h.pageNumber}` : ""} — {h.content.slice(0, 220)}
                {h.content.length > 220 ? "…" : ""}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {validation.contradictionFlags.length ? <p className="text-rose-200">Contradictions: {validation.contradictionFlags.join(" | ")}</p> : <p className="text-emerald-200">No contradictions detected.</p>}
    </div>
  );
}
