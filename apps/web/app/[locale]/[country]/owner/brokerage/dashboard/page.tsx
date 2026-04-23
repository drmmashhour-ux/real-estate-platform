import { redirect } from "next/navigation";
import { executiveDashboardFlags } from "@/config/feature-flags";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { OwnerDashboard } from "@/components/owner-dashboard/OwnerDashboard";
import { getExecutiveSession } from "@/modules/owner-access/executive-visibility.service";
import { buildOwnerDashboardPayload } from "@/modules/owner-dashboard/owner-dashboard.service";
import type { KpiWindow } from "@/modules/broker-kpis/broker-kpis.types";

export const dynamic = "force-dynamic";

export default async function OwnerBrokerageDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; country: string }>;
  searchParams: Promise<{ window?: string }>;
}) {
  const { locale, country } = await params;
  const sp = await searchParams;
  const basePath = `/${locale}/${country}/owner`;

  const userId = await getGuestId();
  if (!userId) redirect(`/auth/login?next=${encodeURIComponent(`${basePath}/brokerage/dashboard`)}`);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!user) redirect(`/${locale}/${country}`);

  const session = await getExecutiveSession(user.id, user.role);
  if (!session) {
    return (
      <div className="rounded-2xl border border-amber-900/40 bg-black/50 p-8 text-center text-zinc-400">
        <p>Accès réservé aux administrateurs plateforme ou dirigeants de bureau résidentiel.</p>
      </div>
    );
  }

  if (!executiveDashboardFlags.ownerDashboardV1 || !executiveDashboardFlags.executiveCompanyMetricsV1) {
    return (
      <div className="rounded-2xl border border-amber-900/40 bg-black/50 p-8 text-center text-zinc-400">
        <p>Tableau exécutif désactivé.</p>
        <p className="mt-2 text-xs">
          <code className="text-amber-200/90">FEATURE_OWNER_DASHBOARD_V1</code> +{" "}
          <code className="text-amber-200/90">FEATURE_EXECUTIVE_COMPANY_METRICS_V1</code>
        </p>
      </div>
    );
  }

  const window = (sp.window ?? "30d") as KpiWindow;
  const dashboard = await buildOwnerDashboardPayload(session.scope, window);

  return <OwnerDashboard basePath={basePath} window={window} data={dashboard} />;
}
