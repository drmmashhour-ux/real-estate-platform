import type { StrategyInsight } from "@/modules/strategy-board/strategy-board.types";

export function StrategyRiskCard({ insight }: { insight: StrategyInsight }) {
  return (
    <article className="rounded-xl border border-amber-900/45 bg-black/50 p-4">
      <h4 className="font-medium text-amber-100/90">{insight.title}</h4>
      <p className="mt-2 text-sm text-zinc-300">{insight.summary}</p>
      <p className="mt-2 text-[10px] uppercase text-zinc-600">Zone: {insight.affectedArea}</p>
    </article>
  );
}
