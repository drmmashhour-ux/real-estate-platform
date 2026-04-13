import Link from "next/link";
import { Suspense } from "react";
import { commandCenterFlags } from "@/config/feature-flags";
import { AlertCard } from "@/components/command-center/AlertCard";
import { ChartCard } from "@/components/command-center/ChartCard";
import { CommandCenterLayout } from "@/components/command-center/CommandCenterLayout";
import { HeatmapCard } from "@/components/command-center/HeatmapCard";
import { InsightFeed } from "@/components/command-center/InsightFeed";
import { KPIGrid } from "@/components/command-center/KPIGrid";
import { SegmentationPanel } from "@/components/command-center/SegmentationPanel";
import { TrendChart } from "@/components/command-center/TrendChart";
import { requireAdminControlUserId } from "@/lib/admin/guard";
import { parseAdminRange } from "@/modules/analytics/services/admin-analytics-service";
import { buildAlertsBundle } from "@/modules/alerts/alert.service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CommandCenterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminControlUserId();
  const sp = await searchParams;
  if (!commandCenterFlags.commandCenterV1) {
    return (
      <CommandCenterLayout
        title="Command center"
        subtitle="Enable FEATURE_COMMAND_CENTER_V1 to load internal metrics and insights."
      >
        <p className="text-sm text-ds-text-secondary">
          This surface is gated by environment flag. No data is shown until enabled by platform ops.
        </p>
      </CommandCenterLayout>
    );
  }

  const range = parseAdminRange({
    range: typeof sp.range === "string" ? sp.range : "30d",
    from: typeof sp.from === "string" ? sp.from : null,
    to: typeof sp.to === "string" ? sp.to : null,
  });
  const city = typeof sp.city === "string" ? sp.city : undefined;
  const segment = city ? { city } : {};

  const bundle = await buildAlertsBundle(range, segment);

  return (
    <CommandCenterLayout
      title="Market Intelligence Command Center"
      subtitle="Internal aggregates only — no fabricated KPIs. Estimates are explicitly labeled in KPI cards."
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link href="/admin/overview" className="text-sm text-ds-gold hover:text-amber-200">
          ← Control tower
        </Link>
        <Suspense fallback={<div className="h-12 rounded-lg bg-white/5" />}>
          <SegmentationPanel />
        </Suspense>
      </div>

      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-ds-text-secondary">Executive KPIs</h2>
        <KPIGrid items={bundle.kpis} />
      </section>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <ChartCard title="Tracked visitors" hint="From platform_analytics daily rows in this range.">
          <TrendChart points={bundle.snapshot.timeseries.visitors} label="Visitors" />
        </ChartCard>
        <ChartCard title="New listings (broker + self)" hint="Daily new inventory from platform stats.">
          <TrendChart points={bundle.snapshot.timeseries.newListings} label="Listings" stroke="#94a3b8" />
        </ChartCard>
        <ChartCard title="Realized revenue (cents/day)" hint="Sum of platform_revenue_events by UTC day.">
          <TrendChart points={bundle.snapshot.timeseries.revenueCents} label="¢" stroke="#22c55e" />
        </ChartCard>
        <HeatmapCard data={bundle.snapshot.supplyDemand} />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <InsightFeed insights={bundle.insights} />
        <AlertCard alerts={bundle.alerts} />
      </div>

      <section className="mt-10 rounded-xl border border-white/5 bg-black/30 p-4 text-xs text-slate-500">
        <p className="font-semibold text-slate-400">Data quality</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          {bundle.snapshot.dataNotes.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      </section>
    </CommandCenterLayout>
  );
}
