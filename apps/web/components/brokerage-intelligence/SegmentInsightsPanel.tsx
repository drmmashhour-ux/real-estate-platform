"use client";

import type { SegmentInsight } from "@/modules/brokerage-intelligence/brokerage-intelligence.types";

type Props = { best: SegmentInsight[]; weak: SegmentInsight[]; className?: string };

export function SegmentInsightsPanel({ best, weak, className }: Props) {
  return (
    <div className={className} data-testid="segment-insights">
      <h3 className="text-sm font-medium text-slate-200">Segment performance (aggregate)</h3>
      <p className="text-xs text-slate-500">Coarse market buckets; low n is unreliable.</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2 text-xs text-slate-300">
        <div>
          <h4 className="text-slate-400">Stronger segments</h4>
          <ul className="mt-1 space-y-0.5">
            {best.slice(0, 5).map((b) => (
              <li key={b.segmentKey} className="truncate" title={b.segmentKey}>
                {b.winRate == null ? "—" : `${(b.winRate * 100).toFixed(0)}%`} — {b.segmentKey.slice(0, 64)}
              </li>
            ))}
            {best.length === 0 ? <li className="text-slate-500">No data</li> : null}
          </ul>
        </div>
        <div>
          <h4 className="text-slate-400">Weaker segments (review)</h4>
          <ul className="mt-1 space-y-0.5">
            {weak.slice(0, 5).map((b) => (
              <li key={b.segmentKey} className="truncate" title={b.segmentKey}>
                {b.winRate == null ? "—" : `${(b.winRate * 100).toFixed(0)}%`} — {b.segmentKey.slice(0, 64)}
              </li>
            ))}
            {weak.length === 0 ? <li className="text-slate-500">No weak bucket flagged</li> : null}
          </ul>
        </div>
      </div>
    </div>
  );
}
