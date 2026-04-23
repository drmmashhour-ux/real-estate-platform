import type { GrowthOpportunity } from "../growth-brain.types";

type Props = { op: GrowthOpportunity; rank: number };

export function GrowthOpportunityCard({ op, rank }: Props) {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-4 text-left text-sm text-zinc-200">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-amber-400">#{rank}</span>
        <span className="text-[10px] uppercase text-zinc-500">{op.domain}</span>
      </div>
      <h3 className="mt-2 font-semibold text-white">{op.title}</h3>
      <p className="mt-1 line-clamp-3 text-xs text-zinc-400">{op.whyNow}</p>
      <dl className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
        <div>
          <dt className="text-zinc-600">Impact</dt>
          <dd className="font-medium text-emerald-300">{op.expectedImpact.toFixed(2)}</dd>
        </div>
        <div>
          <dt className="text-zinc-600">Priority</dt>
          <dd className="font-medium text-sky-300">{op.priorityScore.toFixed(2)}</dd>
        </div>
        <div>
          <dt className="text-zinc-600">Confidence</dt>
          <dd className="font-medium">{op.confidence.toFixed(2)}</dd>
        </div>
      </dl>
    </div>
  );
}
