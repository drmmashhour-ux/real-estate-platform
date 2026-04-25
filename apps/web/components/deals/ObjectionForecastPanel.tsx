import type { ObjectionPathForecast } from "@/modules/negotiation-simulator/negotiation-simulator.types";

const bandClass: Record<"low" | "medium" | "high", string> = {
  low: "text-slate-500",
  medium: "text-amber-200/80",
  high: "text-amber-200",
};

type Props = { f: ObjectionPathForecast };

export function ObjectionForecastPanel({ f }: Props) {
  if (f.likelyObjections.length === 0) {
    return <p className="text-xs text-slate-500">No objection path hints in this pass.</p>;
  }
  return (
    <ul className="space-y-2">
      {f.likelyObjections.map((o) => (
        <li key={o.type} className="rounded border border-slate-800/80 bg-slate-900/40 p-2 text-sm">
          <span className="text-slate-200">{o.type}</span>{" "}
          <span className={`text-xs font-medium ${bandClass[o.probabilityBand]}`}>({o.probabilityBand} band)</span>
          {o.rationale.length > 0 ? (
            <ul className="mt-1 list-inside list-disc text-xs text-slate-500">
              {o.rationale.map((r) => (
                <li key={r.slice(0, 40)}>{r}</li>
              ))}
            </ul>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
