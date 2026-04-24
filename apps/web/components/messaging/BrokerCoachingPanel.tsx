type C = {
  title: string;
  priority: "high" | "medium" | "low";
  rationale: string[];
  recommendedAction: string;
  suggestedApproach?: string;
};

const P: Record<C["priority"], string> = {
  high: "border-rose-500/30 bg-rose-950/25",
  medium: "border-amber-500/25 bg-amber-950/20",
  low: "border-slate-500/20 bg-slate-950/20",
};

export function BrokerCoachingPanel({ items, top }: { items: C[]; top: string | null }) {
  if (items.length === 0) {
    return <p className="text-[11px] text-slate-500">No extra coaching this pass — use your read of the thread.</p>;
  }
  return (
    <div className="space-y-2 text-xs">
      {top ? (
        <p className="text-[10px] text-slate-500">
          <span className="font-semibold text-slate-400">Focus:</span> {top}
        </p>
      ) : null}
      <ul className="max-h-48 space-y-2 overflow-y-auto">
        {items.map((c, i) => (
          <li key={i} className={`rounded-lg border p-2 ${P[c.priority]}`}>
            <p className="font-medium text-slate-100">{c.title}</p>
            <p className="mt-1 text-[10px] text-slate-400">{c.recommendedAction}</p>
            {c.suggestedApproach ? <p className="mt-1 text-[10px] text-slate-500">{c.suggestedApproach}</p> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
