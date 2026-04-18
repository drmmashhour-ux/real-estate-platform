import type { VariantResultRow } from "@/modules/experiments/ab-results.service";

export function VariantComparisonTable({ rows }: { rows: VariantResultRow[] }) {
  if (rows.length === 0) {
    return <p className="text-xs text-zinc-500">No aggregated metrics yet — assign traffic with `ab` in client meta.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-left text-xs text-zinc-300">
        <thead>
          <tr className="border-b border-zinc-800 text-zinc-500">
            <th className="py-2 pr-2">Variant</th>
            <th className="py-2 pr-2">Imp</th>
            <th className="py-2 pr-2">Clicks</th>
            <th className="py-2 pr-2">Leads</th>
            <th className="py-2 pr-2">Bookings</th>
            <th className="py-2 pr-2">CTR</th>
            <th className="py-2 pr-2">CVR</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.variantId} className="border-b border-zinc-900/80">
              <td className="py-2 pr-2 font-mono text-emerald-200/90">{r.variantKey}</td>
              <td className="py-2 pr-2">{r.impressions}</td>
              <td className="py-2 pr-2">{r.clicks}</td>
              <td className="py-2 pr-2">{r.leads}</td>
              <td className="py-2 pr-2">{r.bookings}</td>
              <td className="py-2 pr-2">{r.ctr != null ? `${(r.ctr * 100).toFixed(2)}%` : "—"}</td>
              <td className="py-2 pr-2">{r.cvr != null ? `${(r.cvr * 100).toFixed(2)}%` : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
