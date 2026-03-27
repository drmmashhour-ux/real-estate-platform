import type { ActionSelectionResult } from "@/src/modules/ai-selection-engine/domain/selection.types";

export function ActionRecommendationCard({ result }: { result: ActionSelectionResult }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-4">
      <p className="text-xs uppercase tracking-wide text-[#C9A646]">Recommended action</p>
      <p className="mt-2 text-sm font-semibold text-white">{result.action.replace(/_/g, " ")}</p>
      <p className="mt-1 text-xs text-slate-400">{result.reasons.join(". ")}</p>
      <p className="mt-1 text-xs text-slate-500">Score {result.score} · Confidence {result.confidence}%</p>
    </div>
  );
}
