import type { SupplyDemandAreaRow } from "@/modules/metrics/metrics.types";

export function HeatmapCard({ areas }: { areas: SupplyDemandAreaRow[] }) {
  return (
    <div className="rounded-2xl border border-ds-border bg-ds-card/90 p-5 shadow-ds-soft">
      <h2 className="text-sm font-semibold text-ds-text">City liquidity (internal)</h2>
      <p className="mt-1 text-xs text-ds-text-secondary">7d views/saves vs active FSBO — liquidity.engine</p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="border-b border-ds-border text-[10px] uppercase tracking-wider text-ds-text-secondary">
              <th className="py-2 pr-2">City</th>
              <th className="py-2 pr-2">Score</th>
              <th className="py-2 pr-2">Views</th>
              <th className="py-2 pr-2">Saves</th>
              <th className="py-2">Active</th>
            </tr>
          </thead>
          <tbody>
            {areas.slice(0, 8).map((a) => (
              <tr key={a.city} className="border-b border-white/5 text-ds-text/95">
                <td className="py-2 pr-2 font-medium">{a.city}</td>
                <td className="py-2 pr-2 tabular-nums text-ds-gold">{a.ratio.toFixed(0)}</td>
                <td className="py-2 pr-2 tabular-nums">{a.views7d}</td>
                <td className="py-2 pr-2 tabular-nums">{a.saves7d}</td>
                <td className="py-2 tabular-nums">{a.activeListings}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
