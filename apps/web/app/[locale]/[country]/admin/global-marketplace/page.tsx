import Link from "next/link";
import { requireAdminControlUserId } from "@/lib/admin/guard";
import { engineFlags } from "@/config/feature-flags";
import {
  buildGlobalExecutionSummary,
  buildGlobalInvestorDashboard,
  buildRegionGrowthComparison,
  buildRegionRiskComparison,
  buildTrustComparisonSummary,
} from "@/modules/global-intelligence/global-dashboard.service";
import { buildGlobalDominationSummary } from "@/modules/market-domination/global-market-domination.service";
import { GlobalMarketplaceHero } from "@/components/global/admin/GlobalMarketplaceHero";
import { RegionComparisonTable } from "@/components/global/admin/RegionComparisonTable";
import { GlobalRiskComparisonCard } from "@/components/global/admin/GlobalRiskComparisonCard";
import { GlobalTrustComparisonCard } from "@/components/global/admin/GlobalTrustComparisonCard";
import { GlobalGrowthComparisonCard } from "@/components/global/admin/GlobalGrowthComparisonCard";
import { GlobalAutomationCard } from "@/components/global/admin/GlobalAutomationCard";
import { GlobalRegionCapabilitiesCard } from "@/components/global/admin/GlobalRegionCapabilitiesCard";
import { GlobalDominationSummaryCard } from "@/components/global/admin/GlobalDominationSummaryCard";
import { CrossRegionTrustLeverageCard } from "@/components/global/admin/CrossRegionTrustLeverageCard";
import { buildCrossRegionExpansionTargets, buildCrossRegionTrustLeverageSummary } from "@/modules/market-domination/global-market-domination.service";
import { RegionExpansionTargetsTable } from "@/components/global/admin/RegionExpansionTargetsTable";

export const dynamic = "force-dynamic";

export default async function GlobalMarketplaceAdminPage() {
  await requireAdminControlUserId();

  if (!engineFlags.globalMultiRegionV1 && !engineFlags.globalDashboardV1) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12 text-zinc-300">
        <p>
          Global multi-region UI is disabled. Set <code className="rounded bg-zinc-800 px-1">FEATURE_GLOBAL_DASHBOARD_V1</code>{" "}
          and <code className="rounded bg-zinc-800 px-1">FEATURE_GLOBAL_MULTI_REGION_V1</code>.
        </p>
        <Link href="/admin" className="mt-6 inline-block text-amber-400">
          ← Admin
        </Link>
      </main>
    );
  }

  const [dashboard, risk, growth, trust, execution, domination, expansion, trustLev] = await Promise.all([
    buildGlobalInvestorDashboard(),
    buildRegionRiskComparison(),
    buildRegionGrowthComparison(),
    buildTrustComparisonSummary(),
    buildGlobalExecutionSummary(),
    buildGlobalDominationSummary().catch(() => null),
    Promise.resolve(buildCrossRegionExpansionTargets()),
    buildCrossRegionTrustLeverageSummary().catch(() => ({ rows: [], freshness: new Date().toISOString() })),
  ]);

  return (
    <main className="min-h-screen bg-black text-zinc-100">
      <div className="border-b border-amber-900/20 bg-zinc-950">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-500">Global operations</p>
          <h1 className="mt-2 font-serif text-3xl text-amber-100">Multi-region marketplace</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-500">
            Read-only intelligence — Canada/Québec and Syria stay isolated; shared types come from <code>@lecipm/platform-core</code>.
          </p>
        </div>
      </div>
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
        <GlobalMarketplaceHero summary={dashboard.marketplace} />
        {dashboard.marketplace && <RegionComparisonTable regions={dashboard.marketplace.regions} />}
        {dashboard.marketplace && <GlobalRegionCapabilitiesCard packs={dashboard.marketplace.jurisdictionPacks} />}
        <div className="grid gap-4 md:grid-cols-2">
          <GlobalRiskComparisonCard summary={risk} />
          <GlobalTrustComparisonCard summary={trust} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <GlobalGrowthComparisonCard summary={growth} />
          <GlobalAutomationCard summary={execution} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <GlobalDominationSummaryCard summary={domination} />
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Expansion targets</p>
            <RegionExpansionTargetsTable targets={expansion.targets} />
            <p className="mt-2 text-xs text-zinc-600">{expansion.notes.join(" · ")}</p>
          </div>
        </div>
        <CrossRegionTrustLeverageCard rows={trustLev.rows} freshness={trustLev.freshness} />
        {dashboard.availabilityNotes.length > 0 && (
          <p className="text-xs text-amber-600/80">Notes: {dashboard.availabilityNotes.join(" · ")}</p>
        )}
        <div className="border-t border-zinc-900 pt-6 text-sm text-zinc-500">
          <Link href="/admin" className="text-amber-500">
            ← Admin home
          </Link>
        </div>
      </div>
    </main>
  );
}
