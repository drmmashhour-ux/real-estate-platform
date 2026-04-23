import { PlatformRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { brokerOpsFlags } from "@/config/feature-flags";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { BrokerGrowthDashboard } from "@/components/broker-growth/BrokerGrowthDashboard";
import { buildBrokerGrowthDashboardSnapshot } from "@/modules/broker-growth/broker-growth-aggregation.service";
import { brokerGrowthDisclaimer } from "@/modules/broker-growth/broker-growth-explainer";
import { buildGrowthRecommendations, getBrokerGrowthGoals } from "@/modules/broker-growth-coach/growth-coach.service";
import type { KpiWindow } from "@/modules/broker-kpis/broker-kpis.types";

export const dynamic = "force-dynamic";

export default async function BrokerGrowthPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; country: string }>;
  searchParams: Promise<{ window?: string }>;
}) {
  const { locale, country } = await params;
  const sp = await searchParams;
  const basePath = `/${locale}/${country}/broker/residential`;

  const userId = await getGuestId();
  if (!userId) redirect(`/auth/login?next=${encodeURIComponent(`${basePath}/growth`)}`);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user || (user.role !== PlatformRole.BROKER && user.role !== PlatformRole.ADMIN)) {
    redirect(`/${locale}/${country}/broker`);
  }

  if (!brokerOpsFlags.personalBrokerGrowthDashboardV1) {
    return (
      <div className="rounded-2xl border border-amber-900/40 bg-black/50 p-8 text-center text-zinc-400">
        <p>Tableau de croissance désactivé.</p>
        <p className="mt-2 text-xs">
          Définir <code className="text-amber-200/90">FEATURE_PERSONAL_BROKER_GROWTH_DASHBOARD_V1=1</code>
        </p>
      </div>
    );
  }

  const window = (sp.window ?? "30d") as KpiWindow;
  const data = await buildBrokerGrowthDashboardSnapshot(userId, window);

  let coaching = null;
  if (brokerOpsFlags.brokerGrowthCoachV1) {
    const goals = await getBrokerGrowthGoals(userId);
    coaching = buildGrowthRecommendations({
      metrics: data.growth,
      goals: goals
        ? {
            monthlyLeadTarget: goals.monthlyLeadTarget,
            monthlyClosingTarget: goals.monthlyClosingTarget,
            responseTimeHoursTarget: goals.responseTimeHoursTarget,
            listingConversionRateTarget: goals.listingConversionRateTarget,
            followUpDisciplineTarget: goals.followUpDisciplineTarget,
          }
        : null,
    });
  }

  return (
    <BrokerGrowthDashboard
      basePath={basePath}
      window={window}
      data={{ kpi: data.kpi, growth: data.growth, residentialScopeNote: data.residentialScopeNote }}
      coaching={coaching}
      disclaimer={brokerGrowthDisclaimer()}
    />
  );
}
