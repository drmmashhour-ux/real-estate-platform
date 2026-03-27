import type { StandardDraftOutput } from "@/src/modules/ai-auto-drafting/domain/autoDrafting.types";

export function DraftSuggestionCard({ draft }: { draft: StandardDraftOutput | null }) {
  if (!draft) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-black/30 p-3 text-xs text-slate-200">
      <p className="text-[10px] font-semibold uppercase text-slate-500">Suggested draft</p>
      <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap font-sans text-slate-300">{draft.suggestedText || "—"}</pre>
      <p className="mt-2 text-[10px] text-slate-500">Confidence: {Math.round(draft.confidence * 100)}% · review required</p>
    </div>
  );
}
