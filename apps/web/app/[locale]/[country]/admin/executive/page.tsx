import Link from "next/link";
import { commandCenterFlags } from "@/config/feature-flags";
import { CommandCenterLayout } from "@/components/command-center/CommandCenterLayout";
import { ExecutiveSummary } from "@/components/executive/ExecutiveSummary";
import { GrowthChart } from "@/components/executive/GrowthChart";
import { KPIHighlight } from "@/components/executive/KPIHighlight";
import { MarketStatusCard } from "@/components/executive/MarketStatusCard";
import { RevenueCard } from "@/components/executive/RevenueCard";
import { buildExecutivePayload } from "@/modules/command-center/command-center.service";
import { parseAdminRange } from "@/modules/analytics/services/admin-analytics-service";
import { toMetricsSnapshot } from "@/modules/metrics/metrics.types";
import { requireAdminControlUserId } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function flattenSearchParams(sp: Record<string, string | string[] | undefined>): Record<string, string | undefined> {
  const o: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(sp)) {
    o[k] = typeof v === "string" ? v : Array.isArray(v) ? v[0] : undefined;
  }
  return o;
}

export default async function ExecutiveKpiBoardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminControlUserId();
  const sp = await searchParams;
  const flat = flattenSearchParams(sp);

  if (!commandCenterFlags.executiveDashboardV1) {
    return (
      <CommandCenterLayout
        title="Executive KPI board"
        subtitle="Enable FEATURE_EXECUTIVE_DASHBOARD_V1 for the investor/founder summary."
      >
        <p className="text-sm text-ds-text-secondary">Feature flag is off in this environment.</p>
      </CommandCenterLayout>
    );
  }

  const range = parseAdminRange({
    range: flat.range ?? null,
    from: flat.from ?? null,
    to: flat.to ?? null,
  });
  const params = new URLSearchParams();
  params.set("from", range.from);
  params.set("to", range.to);
  if (range.preset === "7d") params.set("days", "7");
  else if (range.preset === "90d") params.set("days", "90");
  else params.set("days", "30");
  if (flat.city?.trim()) params.set("city", flat.city.trim());

  const bundle = await buildExecutivePayload(params);
  const snapshot = toMetricsSnapshot(bundle.metrics);
  const revGrowth = bundle.kpis.find((k) => k.key === "revenue_growth_rate");
  const liq = bundle.kpis.find((k) => k.key === "liquidity_headline");
  const visitorPoints = bundle.timeseries.map((d) => ({ date: d.date, value: d.visitors }));

  return (
    <CommandCenterLayout title="Executive KPI board" subtitle="High-level view for founders and board prep — same internal sources as the command center.">
      <div className="mb-6">
        <Link href="/admin/command-center" className="text-sm text-ds-gold hover:text-amber-200">
          Full command center →
        </Link>
      </div>

      <ExecutiveSummary snapshot={snapshot} />

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {revGrowth ? <KPIHighlight kpi={revGrowth} /> : null}
        {liq ? <KPIHighlight kpi={liq} /> : null}
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <GrowthChart points={visitorPoints} title="Visitor trend (daily rollup)" />
        <RevenueCard revenue={bundle.metrics.revenue} />
      </div>

      <div className="mt-6">
        <MarketStatusCard supplyDemand={bundle.metrics.supplyDemand} />
      </div>
    </CommandCenterLayout>
  );
}
