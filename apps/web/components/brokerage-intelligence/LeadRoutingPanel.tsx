"use client";

type Suggestion = { recommendedBrokerId: string | null; alternatives: string[]; contextBucket: string; rationale: string[] };

type Props = { items: Suggestion[]; className?: string };

export function LeadRoutingPanel({ items, className }: Props) {
  if (items.length === 0) return null;
  return (
    <div className={className} data-testid="lead-routing-panel">
      <h3 className="text-sm font-medium text-slate-200">Lead routing (suggestions)</h3>
      <p className="text-xs text-slate-500">Operator confirms; no auto-assignment from the dashboard.</p>
      <ul className="mt-2 space-y-2 text-xs text-slate-300">
        {items.map((s) => (
          <li key={s.contextBucket + (s.recommendedBrokerId ?? "")} className="rounded border border-slate-800 p-2">
            <p className="text-slate-500">Context: {s.contextBucket.slice(0, 100)}</p>
            {s.recommendedBrokerId ? <p>Recommended: {s.recommendedBrokerId.slice(0, 10)}…</p> : null}
            {s.alternatives.length > 0 ? <p>Alternates: {s.alternatives.length}</p> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
