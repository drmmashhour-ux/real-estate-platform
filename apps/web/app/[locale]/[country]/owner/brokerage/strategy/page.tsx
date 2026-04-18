import { redirect } from "next/navigation";
import { executiveDashboardFlags } from "@/config/feature-flags";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { StrategyBoard } from "@/components/strategy-board/StrategyBoard";
import { getExecutiveSession } from "@/modules/owner-access/executive-visibility.service";
import { buildStrategyBoardWithMetrics } from "@/modules/strategy-board/strategy-board.service";
import type { KpiWindow } from "@/modules/broker-kpis/broker-kpis.types";

export const dynamic = "force-dynamic";

export default async function OwnerStrategyPage({
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
  if (!userId) redirect(`/auth/login?next=${encodeURIComponent(`${basePath}/brokerage/strategy`)}`);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!user) redirect(`/${locale}/${country}`);

  const session = await getExecutiveSession(user.id, user.role);
  if (!session) {
    return (
      <div className="rounded-2xl border border-amber-900/40 bg-black/50 p-8 text-center text-zinc-400">
        <p>Accès réservé aux dirigeants autorisés.</p>
      </div>
    );
  }

  if (!executiveDashboardFlags.companyStrategyBoardV1 || !executiveDashboardFlags.executiveCompanyMetricsV1) {
    return (
      <div className="rounded-2xl border border-amber-900/40 bg-black/50 p-8 text-center text-zinc-400">
        <p>Tableau stratégique désactivé.</p>
      </div>
    );
  }

  const window = (sp.window ?? "30d") as KpiWindow;
  const { metrics, board } = await buildStrategyBoardWithMetrics(session.scope, window);

  return <StrategyBoard basePath={basePath} metrics={metrics} board={board} />;
}
