import type { BrokerGrowthMetrics } from "@/modules/broker-growth/broker-growth.types";

export function GrowthKPIBar({ growth }: { growth: BrokerGrowthMetrics }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-lg border border-amber-900/40 bg-black/50 px-3 py-2">
        <p className="text-[10px] uppercase tracking-widest text-zinc-500">Actives (rés.)</p>
        <p className="font-mono text-lg text-amber-100">{growth.listings.activeResidentialListings}</p>
      </div>
      <div className="rounded-lg border border-amber-900/40 bg-black/50 px-3 py-2">
        <p className="text-[10px] uppercase tracking-widest text-zinc-500">Conversion pipeline</p>
        <p className="font-mono text-lg text-amber-100">
          {growth.pipeline.leadConversionRate != null ? `${Math.round(growth.pipeline.leadConversionRate * 100)}%` : "—"}
        </p>
      </div>
      <div className="rounded-lg border border-amber-900/40 bg-black/50 px-3 py-2">
        <p className="text-[10px] uppercase tracking-widest text-zinc-500">Vues (fenêtre)</p>
        <p className="font-mono text-lg text-amber-100">{growth.listings.listingViews}</p>
      </div>
      <div className="rounded-lg border border-amber-900/40 bg-black/50 px-3 py-2">
        <p className="text-[10px] uppercase tracking-widest text-zinc-500">Revenu estimé (CAD)</p>
        <p className="font-mono text-lg text-amber-100">
          {growth.revenue.brokerRevenueEstimateCents != null
            ? (growth.revenue.brokerRevenueEstimateCents / 100).toLocaleString("fr-CA", { maximumFractionDigits: 0 })
            : "—"}
        </p>
      </div>
    </div>
  );
}
