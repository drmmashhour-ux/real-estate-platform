import type { StrategyInsight } from "@/modules/strategy-board/strategy-board.types";

export function StrategyOpportunityCard({ insight }: { insight: StrategyInsight }) {
  return (
    <article className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="font-medium text-emerald-100/90">{insight.title}</h4>
        <span className="text-[10px] uppercase text-emerald-500/80">
          {insight.impactLevel} · {insight.urgency}
        </span>
      </div>
      <p className="mt-2 text-sm text-zinc-300">{insight.summary}</p>
      <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-zinc-500">
        {insight.reasons.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
    </article>
  );
}
