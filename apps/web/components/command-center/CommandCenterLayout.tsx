import Link from "next/link";
import type { ReactNode } from "react";
import { AlertCard } from "./AlertCard";
import { ChartCard } from "./ChartCard";
import { HeatmapCard } from "./HeatmapCard";
import { InsightFeed } from "./InsightFeed";
import { KPIGrid } from "./KPIGrid";
import { SegmentationPanel } from "./SegmentationPanel";
import { TrendChart } from "./TrendChart";
import type { CommandCenterPayload } from "./types";

type DataProps = {
  data: CommandCenterPayload;
  searchParams: Record<string, string | undefined>;
  /** Optional read-only slots (e.g. IP & security governance). */
  children?: ReactNode;
};

type PlaceholderProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function CommandCenterLayout(props: DataProps | PlaceholderProps) {
  if ("data" in props) {
    return (
      <CommandCenterDataView data={props.data} searchParams={props.searchParams}>
        {props.children}
      </CommandCenterDataView>
    );
  }
  return (
    <div className="min-h-screen bg-ds-bg px-4 py-8 text-ds-text sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="border-b border-ds-border pb-6">
          <h1 className="font-serif text-3xl tracking-tight text-ds-text">{props.title}</h1>
          {props.subtitle ? <p className="mt-2 max-w-3xl text-sm text-ds-text-secondary">{props.subtitle}</p> : null}
        </header>
        {props.children}
      </div>
    </div>
  );
}

function CommandCenterDataView({ data, searchParams, children }: DataProps) {
  const days = data.meta.days;
  return (
    <div className="min-h-screen bg-ds-bg px-4 py-8 text-ds-text sm:px-6">
      <div className="mx-auto max-w-7xl space-y-8">
        {children}
        <header className="flex flex-col gap-4 border-b border-ds-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link href="/admin" className="text-sm text-ds-gold hover:text-amber-200">
              ← Admin
            </Link>
            <h1 className="mt-3 font-serif text-3xl tracking-tight text-ds-text">Market Intelligence Command Center</h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ds-text-secondary">
              Internal aggregates only — no third-party market fabrications. Estimates are labeled; CTR/funnel depend on
              consistent <code className="text-ds-gold/90">event_logs</code> instrumentation.
            </p>
          </div>
          <SegmentationPanel days={days} city={searchParams.city} />
        </header>

        <KPIGrid kpis={data.kpis} metrics={data.metrics} />

        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard title="New listings / day (platform rollup)" subtitle="Broker + self-serve from platform stats">
            <TrendChart
              data={data.timeseries.map((d) => ({
                label: d.date.slice(5),
                v: d.listingsBroker + d.listingsSelf,
              }))}
              color="#d4af37"
              valueLabel="listings"
            />
          </ChartCard>
          <ChartCard title="Visitor rollup (platform_analytics)" subtitle="Sum of daily rows — not unique users">
            <TrendChart
              data={data.timeseries.map((d) => ({ label: d.date.slice(5), v: d.visitors }))}
              color="#94a3b8"
              valueLabel="visitors"
            />
          </ChartCard>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard title="Closed transaction signals / day" subtitle="Deduped bookings + payments (see get-platform-stats)">
            <TrendChart
              data={data.timeseries.map((d) => ({ label: d.date.slice(5), v: d.transactionsClosed }))}
              color="#4ade80"
              valueLabel="signals"
            />
          </ChartCard>
          <HeatmapCard areas={data.metrics.supplyDemand.topAreas} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {data.meta.marketIntelligenceEnabled ? (
            <>
              <InsightFeed insights={data.insights} />
              <AlertCard alerts={data.alerts} anomalies={data.anomalies} />
            </>
          ) : (
            <div className="rounded-2xl border border-ds-border bg-ds-card/80 p-6 text-sm text-ds-text-secondary shadow-ds-soft lg:col-span-2">
              Enable <code className="text-ds-gold/90">FEATURE_MI_COMMAND_CENTER_V1</code> for the insights feed and
              anomaly-driven alerts.
            </div>
          )}
        </div>

        <footer className="border-t border-ds-border pt-6 text-xs text-ds-text-secondary">
          <p>Prior comparison window: {data.priorRange.from.slice(0, 10)} → {data.priorRange.toExclusive.slice(0, 10)}</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            {data.metrics.dataQualityNotes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </footer>
      </div>
    </div>
  );
}
