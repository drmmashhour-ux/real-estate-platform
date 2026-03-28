import { KpiStatCard } from "@/components/dashboard/lecipm/KpiStatCard";

export type BrokerExecutiveSnapshotProps = {
  listingsVerified: string;
  avgTrustScore: string;
  dealsWorthReviewing: string;
  revenueOrMrr: string;
};

/**
 * Top-row executive metrics — numbers only; parents fetch or derive values.
 */
export function BrokerExecutiveSnapshot({
  listingsVerified,
  avgTrustScore,
  dealsWorthReviewing,
  revenueOrMrr,
}: BrokerExecutiveSnapshotProps) {
  return (
    <section className="space-y-4">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-premium-gold">Executive</p>
        <h2 className="mt-1 text-xl font-semibold text-white">Workspace snapshot</h2>
        <p className="mt-1 text-sm text-slate-500">High-signal KPIs — refreshed from your CRM and listings.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiStatCard label="Listings verified" value={listingsVerified} sublabel="On-platform" />
        <KpiStatCard label="Avg. trust score" value={avgTrustScore} sublabel="Rolling" />
        <KpiStatCard label="Deals worth reviewing" value={dealsWorthReviewing} sublabel="Open offers / alerts" />
        <KpiStatCard label="Revenue / MRR" value={revenueOrMrr} sublabel="Commissions & pipeline" />
      </div>
    </section>
  );
}
