import type { StandardDraftOutput } from "@/src/modules/ai-auto-drafting/domain/autoDrafting.types";

export function ClauseDraftCard({ draft }: { draft: StandardDraftOutput | null }) {
  if (!draft) return null;
  return (
    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-slate-200">
      <p className="text-[10px] font-semibold uppercase text-amber-200/80">Clause scaffold (non-binding)</p>
      <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap font-sans">{draft.suggestedText}</pre>
    </div>
  );
}
