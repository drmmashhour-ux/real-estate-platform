/** Sample signals table — user-safe explanations only. */

import type { MarketplaceSignal } from "@/modules/autonomy/darlink-marketplace-autonomy.types";

type Props = {
  signals: MarketplaceSignal[];
  maxRows?: number;
};

export function DarlinkAutonomySignalsTable(props: Props) {
  const rows = props.signals.slice(0, props.maxRows ?? 24);
  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-stone-200 bg-stone-50 p-4 text-sm text-stone-500">
        No signals in this build (empty snapshot or filters).
      </p>
    );
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
          <tr>
            <th className="px-3 py-2">Severity</th>
            <th className="px-3 py-2">Type</th>
            <th className="px-3 py-2">Entity</th>
            <th className="px-3 py-2">Explanation</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.id} className="border-t border-stone-100 align-top">
              <td className="px-3 py-2 text-xs font-medium text-stone-700">{s.severity}</td>
              <td className="px-3 py-2 font-mono text-xs text-stone-800">{s.type}</td>
              <td className="px-3 py-2 text-xs text-stone-600">
                {s.entityType}
                {s.entityId ? <span className="ml-1 font-mono text-[10px] opacity-70">{s.entityId.slice(0, 8)}…</span> : null}
              </td>
              <td className="px-3 py-2 text-xs text-stone-700">{s.explanation}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
