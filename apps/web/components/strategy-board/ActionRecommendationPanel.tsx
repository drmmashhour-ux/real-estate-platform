import type { StrategyInsight } from "@/modules/strategy-board/strategy-board.types";

export function ActionRecommendationPanel({ insights }: { insights: StrategyInsight[] }) {
  return (
    <div className="rounded-xl border border-amber-900/35 bg-black/50 p-5">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Actions suggérées</h3>
      <ul className="mt-3 space-y-3 text-sm text-zinc-300">
        {insights.map((i) => (
          <li key={i.title}>
            <span className="text-amber-100/90">{i.title}</span>
            <ul className="mt-1 list-disc pl-4 text-xs text-zinc-500">
              {i.suggestedActions.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
