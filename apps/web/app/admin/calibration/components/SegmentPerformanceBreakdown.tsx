"use client";

import type { SegmentPerformanceRow } from "@/modules/continuous-calibration/domain/calibration.types";

function pct(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return `${(100 * n).toFixed(1)}%`;
}

export function SegmentPerformanceBreakdown({ segments }: { segments: SegmentPerformanceRow[] }) {
  if (!segments.length) {
    return <p className="text-sm text-zinc-500">No segment data (empty batch or missing listing segments).</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800">
      <table className="min-w-full text-left text-xs">
        <thead className="border-b border-zinc-800 bg-zinc-950/80 text-[10px] uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-3 py-2">Segment</th>
            <th className="px-3 py-2">n</th>
            <th className="px-3 py-2">Trust agr.</th>
            <th className="px-3 py-2">Deal agr.</th>
            <th className="px-3 py-2">Risk agr.</th>
          </tr>
        </thead>
        <tbody>
          {segments.map((s) => (
            <tr key={s.segmentKey} className="border-b border-zinc-800/80">
              <td className="px-3 py-2 font-mono text-[11px] text-zinc-400">{s.segmentKey}</td>
              <td className="px-3 py-2 tabular-nums text-zinc-300">{s.itemCount}</td>
              <td className="px-3 py-2 tabular-nums text-zinc-200">{pct(s.trustAgreementRate)}</td>
              <td className="px-3 py-2 tabular-nums text-zinc-200">{pct(s.dealAgreementRate)}</td>
              <td className="px-3 py-2 tabular-nums text-zinc-200">{pct(s.riskAgreementRate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
