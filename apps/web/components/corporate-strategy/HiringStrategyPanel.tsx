import type { HiringStrategy } from "@/modules/corporate-strategy/corporate-strategy.types";

export function HiringStrategyPanel({ h }: { h: HiringStrategy }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">Hiring (advisory)</h3>
      <p className="mt-1 text-xs text-amber-800">{h.disclaimer}</p>
      <ul className="mt-3 space-y-3 text-sm text-slate-700">
        {h.roles.map((r) => (
          <li key={r.kind + (r.rationale[0] ?? "")}>
            <span className="font-medium capitalize">{r.kind}</span> — {r.priority} — headcount band {r.headcountHint.min}–{r.headcountHint.max} ({r.headcountHint.basis})
            <p className="text-xs text-slate-500">{r.dataTrace}</p>
            {r.rationale.map((x) => (
              <p key={x.slice(0, 40)} className="text-xs text-slate-600">
                {x}
              </p>
            ))}
          </li>
        ))}
      </ul>
    </div>
  );
}
