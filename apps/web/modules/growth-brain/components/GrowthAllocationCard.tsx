import type { AllocationRecommendation } from "../growth-brain.types";

type Props = { allocation: AllocationRecommendation };

export function GrowthAllocationCard({ allocation }: Props) {
  return (
    <div className="rounded-2xl border border-violet-500/25 bg-violet-950/20 p-5">
      <h3 className="text-sm font-semibold text-violet-100">AI allocation view</h3>
      <p className="mt-1 text-xs text-zinc-500">{allocation.headline}</p>
      <ul className="mt-4 space-y-3">
        {allocation.slices.map((s) => (
          <li key={s.label} className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <div>
              <span className="font-medium text-white">{s.label}</span>
              <span className="ml-2 text-xs text-zinc-500">{s.domain}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold text-violet-200">{s.percent}%</span>
              <span className="text-[11px] text-zinc-500">{s.rationale.slice(0, 80)}…</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
