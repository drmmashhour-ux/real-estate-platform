import type { CoreMetricsBundle } from "@/modules/metrics/metrics.types";
import type { KpiValue } from "@/modules/kpi/kpi.service";

export function KPIGrid({
  kpis,
  metrics,
}: {
  kpis: KpiValue[];
  metrics: CoreMetricsBundle;
}) {
  const top = kpis.slice(0, 8);
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {top.map((k) => (
        <div
          key={k.key}
          className="rounded-2xl border border-ds-border bg-ds-card/90 p-4 shadow-ds-soft"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ds-text-secondary">
            {k.key.replace(/_/g, " ")}
            {k.isEstimate ? (
              <span className="ml-2 rounded bg-amber-500/15 px-1.5 py-0.5 text-amber-200/90">estimate</span>
            ) : null}
          </p>
          <p className="mt-2 font-serif text-2xl text-ds-gold tabular-nums">{k.formatted}</p>
          <p className="mt-2 text-xs leading-snug text-ds-text-secondary">{k.explanation}</p>
        </div>
      ))}
      <div className="rounded-2xl border border-ds-border bg-ds-surface/80 p-4 shadow-ds-soft sm:col-span-2 xl:col-span-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ds-text-secondary">Range snapshot</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-6 text-sm">
          <div>
            <span className="text-ds-text-secondary">Revenue (platform events)</span>
            <p className="font-medium tabular-nums text-ds-text">
              ${(metrics.revenue.totalRevenueCents / 100).toLocaleString("en-CA", { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div>
            <span className="text-ds-text-secondary">CTR</span>
            <p className="font-medium tabular-nums text-ds-text">{(metrics.engagement.ctr * 100).toFixed(2)}%</p>
          </div>
          <div>
            <span className="text-ds-text-secondary">Active listings</span>
            <p className="font-medium tabular-nums text-ds-text">{metrics.marketplace.activeListingsTotal}</p>
          </div>
          <div>
            <span className="text-ds-text-secondary">New users</span>
            <p className="font-medium tabular-nums text-ds-text">{metrics.traffic.newUsersInRange}</p>
          </div>
          <div>
            <span className="text-ds-text-secondary">Sessions rollup</span>
            <p className="font-medium tabular-nums text-ds-text">{metrics.traffic.sessionDaysRollup}</p>
          </div>
          <div>
            <span className="text-ds-text-secondary">Inquiries (event log)</span>
            <p className="font-medium tabular-nums text-ds-text">{metrics.conversion.inquiries}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
