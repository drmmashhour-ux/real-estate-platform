"use client";

type P = { dealId: string; result: { priorityScore: number; riskLevel: string; urgencyLevel: string; rationale: string[] } };

type Props = { items: P[]; className?: string };

export function DealPriorityList({ items, className }: Props) {
  if (items.length === 0) return null;
  const sorted = [...items].sort((a, b) => b.result.priorityScore - a.result.priorityScore);
  return (
    <div className={className} data-testid="deal-priority-list">
      <h3 className="text-sm font-medium text-slate-200">Deal priorities (0–100)</h3>
      <ul className="mt-2 space-y-1.5 text-xs">
        {sorted.map((d) => (
          <li key={d.dealId} className="flex flex-wrap items-baseline gap-2 text-slate-300">
            <span className="font-mono text-amber-200/90">{d.dealId.slice(0, 10)}…</span>
            <span>score {d.result.priorityScore.toFixed(0)}</span>
            <span className="text-slate-500">risk {d.result.riskLevel} · urgency {d.result.urgencyLevel}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
