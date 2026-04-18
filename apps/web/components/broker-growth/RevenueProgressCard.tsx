import type { BrokerGrowthMetrics } from "@/modules/broker-growth/broker-growth.types";

export function RevenueProgressCard({ growth }: { growth: BrokerGrowthMetrics }) {
  return (
    <div className="rounded-xl border border-amber-900/35 bg-black/45 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Commission (estimation)</h3>
      <p className="mt-2 font-mono text-2xl text-amber-100">
        {growth.revenue.brokerRevenueEstimateCents != null
          ? new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD" }).format(
              growth.revenue.brokerRevenueEstimateCents / 100,
            )
          : "—"}
      </p>
      <p className="mt-1 text-[11px] text-zinc-500">
        Parts courtier sur dossiers approuvés dans la fenêtre (échantillon: {growth.revenue.commissionCaseSampleSize}).
      </p>
    </div>
  );
}
