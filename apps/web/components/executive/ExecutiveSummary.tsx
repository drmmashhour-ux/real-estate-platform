import type { MetricsSnapshot } from "@/modules/metrics/metrics.types";

export function ExecutiveSummary({ snapshot }: { snapshot: MetricsSnapshot }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="rounded-xl border border-ds-border bg-ds-card p-5 shadow-ds-soft">
        <p className="text-xs uppercase tracking-wide text-ds-text-secondary">New users</p>
        <p className="mt-2 text-3xl font-semibold text-ds-gold">{snapshot.traffic.newUsers}</p>
      </div>
      <div className="rounded-xl border border-ds-border bg-ds-card p-5 shadow-ds-soft">
        <p className="text-xs uppercase tracking-wide text-ds-text-secondary">Realized revenue ({snapshot.revenue.currency})</p>
        <p className="mt-2 text-3xl font-semibold text-ds-gold">
          {(snapshot.revenue.totalRealizedCents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </p>
        <p className="mt-1 text-xs text-ds-text-secondary">From platform revenue events (minor units ÷100).</p>
      </div>
      <div className="rounded-xl border border-ds-border bg-ds-card p-5 shadow-ds-soft">
        <p className="text-xs uppercase tracking-wide text-ds-text-secondary">Listing views (user events)</p>
        <p className="mt-2 text-3xl font-semibold text-ds-gold">{snapshot.engagement.listingImpressions}</p>
      </div>
    </div>
  );
}
