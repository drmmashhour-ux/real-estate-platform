"use client";

type A = {
  key: string;
  title: string;
  priority: "low" | "medium" | "high";
  rationale: string[];
  suggestedApproach?: string;
  suggestedMessageGoal?: string;
};

const PRI: Record<A["priority"], string> = {
  high: "text-rose-200",
  medium: "text-amber-200",
  low: "text-slate-300",
};

export function NextCloseActionsList({ actions }: { actions: A[] }) {
  if (actions.length === 0) {
    return <p className="text-xs text-slate-500">No ranked actions in this pass.</p>;
  }
  return (
    <ol className="list-decimal space-y-2 pl-4 text-sm">
      {actions.slice(0, 8).map((a) => (
        <li key={a.key} className="text-slate-200">
          <span className={PRI[a.priority]}>[{a.priority}] </span>
          {a.title}
          {a.suggestedMessageGoal ? (
            <span className="ml-1 text-[10px] text-slate-500">(draft goal: {a.suggestedMessageGoal})</span>
          ) : null}
          <ul className="mt-1 list-inside list-disc text-xs text-slate-400">
            {a.rationale.slice(0, 2).map((r) => (
              <li key={r.slice(0, 20)}>{r}</li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}
