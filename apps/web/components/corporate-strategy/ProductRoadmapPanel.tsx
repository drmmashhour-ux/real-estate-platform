import type { ProductRoadmapStrategy } from "@/modules/corporate-strategy/corporate-strategy.types";

export function ProductRoadmapPanel({ p }: { p: ProductRoadmapStrategy }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">Product roadmap (signals)</h3>
      <p className="mt-1 text-xs text-amber-800">{p.disclaimer}</p>
      <p className="mt-2 text-xs font-medium text-slate-600">Prioritize</p>
      <ul className="mt-1 list-inside list-disc text-sm text-slate-700">
        {p.prioritize.map((i) => (
          <li key={i.key}>
            {i.title} <span className="text-slate-500">({i.priority})</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs font-medium text-slate-600">De-prioritize / review</p>
      <ul className="mt-1 list-inside list-disc text-sm text-slate-600">
        {p.deprioritize.length === 0 ? <li className="list-none">None flagged</li> : p.deprioritize.map((i) => <li key={i.key}>{i.title}</li>)}
      </ul>
    </div>
  );
}
