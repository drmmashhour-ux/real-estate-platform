import type { SupplyDemandMetrics } from "@/modules/metrics/metrics.types";

export function MarketStatusCard({ supplyDemand }: { supplyDemand: SupplyDemandMetrics }) {
  const top = supplyDemand.topAreas[0];
  const note = supplyDemand.note ?? supplyDemand.supplyDemandNote;
  return (
    <div className="rounded-xl border border-ds-border bg-ds-card p-5 shadow-ds-soft">
      <h2 className="text-sm font-semibold text-white">Market health (internal)</h2>
      <p className="mt-2 text-sm text-ds-text-secondary">{note}</p>
      {top ? (
        <p className="mt-4 text-lg font-medium text-ds-gold">
          Top city: {top.city} — liquidity {top.ratio.toFixed(0)} ({top.activeListings} active FSBO)
        </p>
      ) : (
        <p className="mt-4 text-sm text-ds-text-secondary">No city aggregates yet.</p>
      )}
    </div>
  );
}
