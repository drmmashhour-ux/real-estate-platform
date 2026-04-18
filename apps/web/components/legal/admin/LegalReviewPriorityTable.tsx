import type { LegalQueueItemScore } from "@/modules/legal/legal-intelligence.types";
import { LegalQueuePriorityBadge } from "./LegalQueuePriorityBadge";

export function LegalReviewPriorityTable({ prioritized }: { prioritized: LegalQueueItemScore[] }) {
  if (!prioritized.length) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
        <p className="text-xs text-slate-500">Review queue empty for current filters.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/40">
      <table className="min-w-full text-left text-xs">
        <thead className="border-b border-slate-800 text-slate-400">
          <tr>
            <th className="px-3 py-2 font-medium">Priority</th>
            <th className="px-3 py-2 font-medium">Score</th>
            <th className="px-3 py-2 font-medium">Label</th>
            <th className="px-3 py-2 font-medium">Listing</th>
          </tr>
        </thead>
        <tbody>
          {prioritized.slice(0, 40).map((row) => (
            <tr key={row.itemId} className="border-b border-slate-800/80 align-top">
              <td className="px-3 py-2">
                <LegalQueuePriorityBadge level={row.level} />
              </td>
              <td className="px-3 py-2 font-mono text-slate-200">{row.score}</td>
              <td className="px-3 py-2 text-slate-300">
                <div>{row.label}</div>
                <ul className="mt-1 list-inside list-disc text-[10px] text-slate-500">
                  {row.reasons.slice(0, 3).map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </td>
              <td className="px-3 py-2 font-mono text-[10px] text-slate-500">{row.entityId}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
