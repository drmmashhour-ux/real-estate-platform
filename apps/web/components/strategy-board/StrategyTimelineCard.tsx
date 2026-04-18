export function StrategyTimelineCard({ rangeLabel }: { rangeLabel: string }) {
  return (
    <div className="rounded-xl border border-dashed border-amber-900/30 bg-black/30 p-4 text-xs text-zinc-500">
      Fenêtre d’analyse: <span className="text-zinc-400">{rangeLabel}</span>. Les jalons détaillés par bureau peuvent être branchés
      dans une itération suivante.
    </div>
  );
}
