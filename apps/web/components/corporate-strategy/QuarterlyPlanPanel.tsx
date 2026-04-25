import type { QuarterlyPlan } from "@/modules/corporate-strategy/corporate-strategy.types";

export function QuarterlyPlanPanel({ q }: { q: QuarterlyPlan }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">Quarterly shape (narrative)</h3>
      <p className="mt-1 text-xs text-amber-800">{q.disclaimer}</p>
      <p className="mt-2 text-xs font-medium text-slate-600">Top focus</p>
      <ol className="mt-1 list-decimal pl-4 text-sm text-slate-800">
        {q.topPriorities.map((p) => (
          <li key={p.rank} className="mb-1">
            <span className="text-slate-500">[{p.category}]</span> {p.title}
          </li>
        ))}
      </ol>
      <div className="mt-3 grid gap-1 text-xs text-slate-600 sm:grid-cols-2">
        <p>
          <span className="font-medium">Hiring:</span> {q.hiringFocus.join(" · ") || "—"}
        </p>
        <p>
          <span className="font-medium">Budget:</span> {q.budgetFocus.join(" · ") || "—"}
        </p>
        <p>
          <span className="font-medium">Product:</span> {q.productFocus.join(" · ") || "—"}
        </p>
        <p>
          <span className="font-medium">Expansion:</span> {q.expansionFocus.join(" · ") || "—"}
        </p>
      </div>
    </div>
  );
}
