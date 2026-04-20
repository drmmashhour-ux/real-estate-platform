import type { MarketplaceSignal } from "@/modules/autonomous-marketplace/types/domain.types";

export function ListingPreviewSignalsTable({ signals }: { signals: MarketplaceSignal[] }) {
  if (!signals.length) {
    return (
      <p className="rounded-lg border border-zinc-800 bg-[#0a0a0a] p-3 text-xs text-zinc-500">No preview signals.</p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-zinc-800 bg-[#141414] text-zinc-500">
          <tr>
            <th className="px-3 py-2 font-medium">Type</th>
            <th className="px-3 py-2 font-medium">Confidence</th>
            <th className="px-3 py-2 font-medium">Explanation</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {signals.map((s) => (
            <tr key={s.id} className="text-zinc-300">
              <td className="px-3 py-2 font-mono text-[11px] text-amber-200/90">{s.signalType}</td>
              <td className="px-3 py-2 font-mono">{s.confidence}</td>
              <td className="px-3 py-2 text-zinc-400">{s.explanation}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
