"use client";

import { DetailDrawer } from "@/components/admin/DetailDrawer";

export type ConversionFeedRow = {
  id: string;
  event: string;
  createdAtIso: string;
  payload: unknown;
};

type Props = {
  rows: ConversionFeedRow[];
  emptyMessage?: string;
};

/**
 * Launch / checkout events with drawer instead of raw JSON in cells.
 */
export function MonetizationConversionFeedClient({ rows, emptyMessage }: Props) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0b0b0b]">
      <table className="min-w-[720px] w-full text-left text-sm">
        <thead className="border-b border-white/10 text-white/60">
          <tr>
            <th className="px-4 py-3">Event</th>
            <th className="px-4 py-3">Time</th>
            <th className="px-4 py-3 text-right">Payload</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-4 py-10 text-center text-white/50">
                {emptyMessage ?? "No events in range."}
              </td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr key={r.id} className="border-b border-white/5 transition hover:bg-white/5">
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-emerald-400">{r.event}</td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-white/50">{r.createdAtIso}</td>
                <td className="px-4 py-3 text-right">
                  <DetailDrawer data={r.payload} triggerLabel="View" title={`Event: ${r.event}`} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
