"use client";

type R = { key: string; title: string; priority: "low" | "medium" | "high"; rationale: string[]; suggestedApproach?: string };
const P: Record<R["priority"], string> = { high: "text-rose-200", medium: "text-amber-200", low: "text-slate-300" };

export function OfferRecommendationsList({ items }: { items: R[] }) {
  if (items.length === 0) return <p className="text-xs text-slate-500">No recommendations in this pass.</p>;
  return (
    <ol className="list-decimal space-y-2 pl-4 text-sm text-slate-200">
      {items.slice(0, 8).map((a) => (
        <li key={a.key}>
          <span className={P[a.priority]}>[{a.priority}] </span>
          {a.title}
          {a.suggestedApproach ? <span className="ml-1 block text-[10px] text-slate-500">→ {a.suggestedApproach}</span> : null}
          <ul className="mt-1 list-inside list-disc text-xs text-slate-400">
            {a.rationale.slice(0, 2).map((r) => (
              <li key={r.slice(0, 24)}>{r}</li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}
