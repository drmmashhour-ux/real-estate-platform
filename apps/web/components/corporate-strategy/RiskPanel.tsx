import type { StrategicRisk } from "@/modules/corporate-strategy/corporate-strategy.types";

export function RiskPanel({ items }: { items: StrategicRisk[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">Strategic risks</h3>
      <ul className="mt-2 space-y-2 text-sm text-slate-800">
        {items.map((r) => (
          <li key={r.type + r.message.slice(0, 20)} className="rounded border border-slate-100 p-2">
            <span className="text-xs text-slate-500">{r.severity}</span> — {r.message}
            <p className="text-xs text-slate-600">{r.rationale}</p>
            <p className="text-xs text-amber-900/90">Mitigation: {r.mitigation}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
