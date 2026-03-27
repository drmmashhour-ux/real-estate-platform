import type { PortfolioTrustAnalyticsDto } from "@/lib/trustgraph/domain/portfolio";

export function PortfolioHealthCards({ data }: { data: PortfolioTrustAnalyticsDto }) {
  const items = [
    { label: "Listings in scope", value: data.totalListings },
    { label: "Verified / high trust", value: data.verifiedHighTrustPercent != null ? `${data.verifiedHighTrustPercent}%` : "—" },
    { label: "Critical issues", value: data.criticalUnresolvedPercent != null ? `${data.criticalUnresolvedPercent}%` : "—" },
    { label: "Avg hours to verification", value: data.avgHoursToVerification ?? "—" },
    { label: "SLA breach rate", value: data.slaBreachRatePercent != null ? `${data.slaBreachRatePercent}%` : "—" },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((c) => (
        <div key={c.label} className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <div className="text-sm text-neutral-500">{c.label}</div>
          <div className="mt-1 text-xl font-semibold">{c.value}</div>
        </div>
      ))}
    </div>
  );
}
