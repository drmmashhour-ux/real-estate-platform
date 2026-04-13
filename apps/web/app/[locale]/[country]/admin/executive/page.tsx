import Link from "next/link";
import { commandCenterFlags } from "@/config/feature-flags";
import { ExecutiveSummary } from "@/components/executive/ExecutiveSummary";
import { GrowthChart } from "@/components/executive/GrowthChart";
import { KPIHighlight } from "@/components/executive/KPIHighlight";
import { MarketStatusCard } from "@/components/executive/MarketStatusCard";
import { RevenueCard } from "@/components/executive/RevenueCard";
import { CommandCenterLayout } from "@/components/command-center/CommandCenterLayout";
import { requireAdminControlUserId } from "@/lib/admin/guard";
import { parseAdminRange } from "@/modules/analytics/services/admin-analytics-service";
import { buildAlertsBundle } from "@/modules/alerts/alert.service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ExecutiveKpiBoardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminControlUserId();
  const sp = await searchParams;
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
    range: typeof sp.range === "string" ? sp.range : "30d",
    from: typeof sp.from === "string" ? sp.from : null,
    to: typeof sp.to === "string" ? sp.to : null,
  });
  const bundle = await buildAlertsBundle(range, {});

  const revGrowth = bundle.kpis.find((k) => k.id === "revenue_growth_pct");
  const liq = bundle.kpis.find((k) => k.id === "liquidity_score");

  return (
    <CommandCenterLayout
      title="Executive KPI board"
      subtitle="High-level view for founders and board prep — same internal sources as the command center."
    >
      <div className="mb-6">
        <Link href="/admin/command-center" className="text-sm text-ds-gold hover:text-amber-200">
          Full command center →
        </Link>
      </div>

      <ExecutiveSummary snapshot={bundle.snapshot} />

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {revGrowth ? <KPIHighlight kpi={revGrowth} /> : null}
        {liq ? <KPIHighlight kpi={liq} /> : null}
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <GrowthChart points={bundle.snapshot.timeseries.visitors} title="Visitor trend" />
        <RevenueCard revenue={bundle.snapshot.revenue} />
      </div>

      <div className="mt-6">
        <MarketStatusCard supplyDemand={bundle.snapshot.supplyDemand} />
      </div>
    </CommandCenterLayout>
  );
}
