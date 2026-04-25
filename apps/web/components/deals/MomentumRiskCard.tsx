import type { MomentumRiskResult } from "@/modules/negotiation-simulator/negotiation-simulator.types";

const cls: Record<MomentumRiskResult["level"], string> = {
  low: "text-emerald-300",
  medium: "text-amber-300",
  high: "text-rose-300",
};

type Props = { m: MomentumRiskResult };

export function MomentumRiskCard({ m }: Props) {
  return (
    <div className="rounded border border-slate-800 bg-slate-900/50 p-3">
      <h3 className="text-sm font-medium text-slate-200">Momentum loss risk (heuristic)</h3>
      <p className={`mt-1 text-sm font-semibold uppercase ${cls[m.level]}`}>{m.level}</p>
      {m.rationale.length > 0 ? (
        <ul className="mt-2 list-inside list-disc text-xs text-slate-500">
          {m.rationale.map((t) => (
            <li key={t.slice(0, 60)}>{t}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
