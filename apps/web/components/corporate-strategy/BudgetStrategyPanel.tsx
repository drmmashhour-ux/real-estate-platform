import type { BudgetStrategy } from "@/modules/corporate-strategy/corporate-strategy.types";

export function BudgetStrategyPanel({ b }: { b: BudgetStrategy }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">Budget &amp; GTM focus</h3>
      <p className="mt-1 text-xs text-amber-800">{b.disclaimer}</p>
      <ul className="mt-2 space-y-2 text-sm">
        {b.lines.map((l) => (
          <li key={l.label} className="rounded border border-slate-100 bg-slate-50/80 p-2">
            <span className="font-medium text-slate-800">{l.action.toUpperCase()}</span> — {l.label}
            <p className="text-xs text-slate-500">{l.dataTrace}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
