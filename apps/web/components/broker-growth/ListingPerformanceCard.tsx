import type { BrokerGrowthMetrics } from "@/modules/broker-growth/broker-growth.types";

export function ListingPerformanceCard({ growth }: { growth: BrokerGrowthMetrics }) {
  return (
    <div className="rounded-xl border border-amber-900/35 bg-black/45 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Inscriptions résidentielles</h3>
      <dl className="mt-3 grid gap-2 text-sm text-zinc-300">
        <div className="flex justify-between gap-2">
          <dt>Demandes / vues</dt>
          <dd className="font-mono text-amber-100">
            {growth.listings.listingInquiryRate != null ? growth.listings.listingInquiryRate.toFixed(3) : "—"}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>Sauvegardes / vues</dt>
          <dd className="font-mono text-amber-100">
            {growth.listings.listingSaveRate != null ? growth.listings.listingSaveRate.toFixed(3) : "—"}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>Index engagement (interne)</dt>
          <dd className="font-mono text-amber-100">
            {growth.listings.listingMarketingEngagementIndexAvg ?? "—"}{" "}
            <span className="text-[10px] text-zinc-600">(n={growth.listings.engagementSampleSize})</span>
          </dd>
        </div>
      </dl>
    </div>
  );
}
