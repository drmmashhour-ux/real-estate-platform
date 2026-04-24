import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";
import { hubNavigation } from "@/lib/hub/navigation";
import { HubLayout } from "@/components/hub/HubLayout";
import { InvestorCompanyDashboardClient } from "@/components/investor/InvestorCompanyDashboardClient";
import { canViewCompanyInvestorDashboard } from "@/lib/investor-company/access";
import { InvestorDashboardClient } from "./InvestorDashboardClient";
import { DecisionCard } from "@/components/ai/DecisionCard";
import { safeEvaluateDecision } from "@/modules/ai/decision-engine";
import { isDealAnalyzerAlertsEnabled, isDealAnalyzerPortfolioMonitoringEnabled } from "@/modules/deal-analyzer/config";
import { PortfolioAlertsPanel } from "@/components/deal/PortfolioAlertsPanel";
import { PortfolioMonitoringPanel } from "@/components/deal/PortfolioMonitoringPanel";
import { isCopilotEnabled } from "@/modules/copilot/config";
import { CopilotFloatingDock } from "@/modules/copilot/ui/CopilotFloatingDock";
import { InvestorOpportunityStrip } from "@/components/dashboard/lecipm/InvestorOpportunityStrip";
import { TrustDealSummaryCard } from "@/components/conversion/TrustDealSummaryCard";
import { NextActionPanel } from "@/components/conversion/NextActionPanel";
import { InlineUpgradeBanner } from "@/components/conversion/InlineUpgradeBanner";
import { HubJourneyBanner } from "@/components/journey/HubJourneyBanner";
import { InvestorComplianceSnapshot } from "@/components/investor/InvestorComplianceSnapshot";
import { InvestorPortfolioEsgPanel } from "@/components/investor/InvestorPortfolioEsgPanel";
import { InvestorHubGoldDashboard } from "@/components/investor/InvestorHubGoldDashboard";
import { InvestorHubLuxuryShell } from "@/components/dashboard/InvestorHubLuxuryShell";
import { getInvestorDashboardData } from "@/modules/dashboard/services/investor-dashboard.service";
import { runPortfolioEsgAnalysis } from "@/modules/investor-esg/portfolio-esg.engine";
import { deriveIllustrativeEsgScore } from "@/modules/investor-esg/portfolio-scoring";
import type { PortfolioPropertyInput } from "@/modules/investor-esg/portfolio.types";

export const dynamic = "force-dynamic";

export default async function InvestorDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; country: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale, country } = await params;
  const sp = (await searchParams) ?? {};
  const classicRaw = sp.classic;
  const classic =
    typeof classicRaw === "string" ? classicRaw : Array.isArray(classicRaw) ? classicRaw[0] : undefined;

  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?returnUrl=/dashboard/investor");

  if (classic !== "1") {
    const investorLuxury = await getInvestorDashboardData(userId);
    return <InvestorHubLuxuryShell locale={locale} country={country} model={investorLuxury} />;
  }

  const [scenarios, comparison, dbUser, scenarioForEsg] = await Promise.all([
    prisma.portfolioScenario.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: {
        id: true,
        title: true,
        scenarioKind: true,
        projectedAverageRoiPercent: true,
        projectedMonthlyCashFlowCents: true,
        projectedRiskLevel: true,
        updatedAt: true,
        _count: { select: { items: true } },
      },
    }),
    prisma.propertyComparison.findUnique({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { role: true } }),
    prisma.portfolioScenario.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: {
        title: true,
        items: {
          take: 48,
          select: {
            id: true,
            listingId: true,
            purchasePriceCents: true,
            city: true,
            riskLevel: true,
            fitScore: true,
          },
        },
      },
    }),
  ]);

  const portfolioEsgInputs: PortfolioPropertyInput[] =
    scenarioForEsg?.items.map((it) => ({
      id: it.id,
      label: it.city?.trim() || `Listing ${it.listingId.slice(0, 8)}…`,
      propertyValue: Math.max(0, it.purchasePriceCents / 100),
      esgScore: deriveIllustrativeEsgScore({ riskLevel: it.riskLevel, fitScore: it.fitScore }),
    })) ?? [];

  const portfolioEsg =
    portfolioEsgInputs.length > 0 ? runPortfolioEsgAnalysis(portfolioEsgInputs) : null;

  const investorDecision = await safeEvaluateDecision({
    hub: "investor",
    userId,
    userRole: dbUser?.role ?? "USER",
    entityType: "platform",
    entityId: null,
  });

  const topOpps = scenarios.slice(0, 3).map((s) => ({
    title: s.title,
    body: `Est. ROI ${Number(s.projectedAverageRoiPercent).toFixed(1)}% · ${s._count.items} assets`,
  }));
  const watchCols =
    scenarios.length > 0
      ? [{ title: "Latest scenario", body: "Review alerts in portfolio planner for drift vs. assumptions." }]
      : [{ title: "No watchlist yet", body: "Save scenarios to track changes." }];
  const riskCols = [
    { title: "Risk posture", body: "Modeled risk levels are shown per scenario — not a guarantee." },
  ];
  const bnhubCols = [{ title: "BNHUB", body: "Short-term revenue candidates appear when BNHUB listings are linked." }];
  const portfolioDealSignal =
    scenarios.length > 0 ? Math.max(0, Math.min(100, Math.round(Number(scenarios[0]!.projectedAverageRoiPercent) * 10))) : null;

  const showCompanyInvestor =
    dbUser?.role != null && canViewCompanyInvestorDashboard(dbUser.role);

  return (
    <HubLayout title="Investor" hubKey="investments" navigation={hubNavigation.investments} showAdminInSwitcher={false}>
      <div className="space-y-8">
        {showCompanyInvestor ?
          <InvestorCompanyDashboardClient locale={locale} country={country} />
        : null}
        <HubJourneyBanner hub="investor" locale={locale} country={country} userId={userId} />

        {/* PART 11: GLOBAL REGULATORY DISCLOSURE */}
        <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-lg">AMF</span>
              <div>
                <p className="text-sm font-bold text-white">Québec Regulatory Alignment: Simulation Mode Active</p>
                <p className="text-xs text-blue-200/80 mt-0.5">
                  This platform is operated in <strong>Simulation Mode</strong>. All financial projections, ROI estimates, and capital allocations are for educational purposes only.
                </p>
              </div>
            </div>
            <div className="hidden sm:block">
              <span className="rounded-full bg-blue-600/20 px-2.5 py-1 text-[10px] font-bold text-blue-400 uppercase tracking-widest border border-blue-400/30">
                Not Financial Advice
              </span>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 border-t border-blue-500/20 pt-3">
            <div className="flex items-start gap-2">
              <span className="text-blue-400 text-xs">⚖️</span>
              <p className="text-[10px] text-blue-300/70 italic">Separation: Brokerage (OACIQ) vs. Investment (AMF) strictly enforced by domain.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-400 text-xs">🛡️</span>
              <p className="text-[10px] text-blue-300/70 italic">Investor Protection: Risk disclosures and suitability checks required for all simulated actions.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-400 text-xs">📋</span>
              <p className="text-[10px] text-blue-300/70 italic">Audit: Every AI-driven reasoning step is logged for regulatory end-to-end traceability.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-premium-gold">Portfolio workspace</p>
            <h1 className="text-2xl font-bold text-white">Saved scenarios & tools</h1>
            <p className="mt-1 text-sm text-slate-500">Estimates only — not advice.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/invest/portfolio"
              className="rounded-xl bg-premium-gold px-5 py-2.5 text-sm font-bold text-black"
            >
              Open portfolio planner
            </Link>
            <Link
              href={`/${locale}/${country}/dashboard/investor/acquisition`}
              className="rounded-xl border border-white/15 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/5"
            >
              BNHub acquisition simulator
            </Link>
          </div>
        </div>

        <InvestorHubGoldDashboard />

        <DecisionCard
          title="AI Market Insight"
          result={investorDecision}
          actionHref="/invest/portfolio"
          actionLabel="Open portfolio planner"
        />

        {portfolioEsg ? (
          <InvestorPortfolioEsgPanel
            result={portfolioEsg}
            scenarioTitle={scenarioForEsg?.title ?? null}
            sourceNote="Per-asset ESG scores are illustrative when true green audits are unavailable — derived from scenario risk/fit signals for portfolio weighting."
          />
        ) : null}
        <section className="grid gap-4 lg:grid-cols-2">
          <TrustDealSummaryCard
            trustScore={null}
            dealScore={portfolioDealSignal}
            confidence={scenarios.length > 0 ? "medium" : "low"}
            reasons={
              scenarios.length > 0
                ? ["Signal inferred from latest scenario ROI", "Use planner for full confidence breakdown"]
                : ["No scenarios yet. Create one to generate decision signals."]
            }
          />
          <NextActionPanel
            title="What should you do next?"
            body="Review your top scenario, compare alternatives, then save a lead-ready short list."
            ctaHref="/invest/portfolio"
            ctaLabel="Review scenarios"
            secondaryHref="/dashboard/investments/compare"
            secondaryLabel="Compare opportunities"
          />
        </section>
        <InlineUpgradeBanner text="Unlock premium investor insights for deeper confidence and faster decisions." />

        <InvestorComplianceSnapshot />

        {isCopilotEnabled() ? <CopilotFloatingDock /> : null}

        <InvestorOpportunityStrip
          opportunities={topOpps.length ? topOpps : [{ title: "No scenarios yet", body: "Create a portfolio scenario to see ranked opportunities." }]}
          watchlist={watchCols}
          risk={riskCols}
          bnhub={bnhubCols}
        />

        {isDealAnalyzerAlertsEnabled() ? <PortfolioAlertsPanel enabled /> : null}

        {isDealAnalyzerPortfolioMonitoringEnabled() ? <PortfolioMonitoringPanel enabled /> : null}

        <section className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-premium-gold">FSBO listing labels</p>
          <p className="mt-2 text-sm text-slate-400">
            On FSBO properties we show a rules-based tag such as{" "}
            <span className="text-emerald-300/95">Good deal</span>,{" "}
            <span className="text-amber-200/95">Undervalued property</span>, or{" "}
            <span className="text-red-300/95">High risk investment</span> — combining trust/risk scores and simple price
            per sq ft checks. Estimates only, not advice — always do your own diligence.
          </p>
          <Link href="/sell#browse-listings" className="mt-3 inline-block text-sm font-medium text-premium-gold hover:underline">
            Browse FSBO directory →
          </Link>
        </section>

        <InvestorDashboardClient scenarios={scenarios} compareIds={comparison?.listingIds ?? []} />
      </div>
    </HubLayout>
  );
}
