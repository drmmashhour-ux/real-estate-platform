import type { BottleneckInsight } from "@/modules/corporate-strategy/corporate-strategy.types";

export function BottlenecksPanel({ items }: { items: BottleneckInsight[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">Bottlenecks</h3>
      <p className="mt-1 text-xs text-slate-500">Heuristic; not a root-cause verdict.</p>
      <ul className="mt-2 space-y-2 text-sm">
        {items.map((i) => (
          <li key={i.id} className="rounded border border-amber-100/80 bg-amber-50/30 p-2 text-slate-800">
            <span className="text-xs font-semibold uppercase text-amber-900/80">{i.severity}</span> · {i.title}
            <p className="text-xs text-slate-600">{i.rationale}</p>
            <p className="text-xs text-slate-500">→ {i.suggestedResponse}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
