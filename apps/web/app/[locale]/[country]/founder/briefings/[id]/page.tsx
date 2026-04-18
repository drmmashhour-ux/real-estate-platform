import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { executiveDashboardFlags, founderWorkspaceFlags } from "@/config/feature-flags";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getExecutiveSession } from "@/modules/owner-access/executive-visibility.service";
import { getBriefingByIdForScope } from "@/modules/executive-briefing/briefing-history.service";
import { ExecutiveBriefingViewer } from "@/components/executive-briefing/ExecutiveBriefingViewer";
import { BriefingReviewBar } from "@/components/executive-briefing/BriefingReviewBar";

export const dynamic = "force-dynamic";

export default async function FounderBriefingDetailPage({
  params,
}: {
  params: Promise<{ locale: string; country: string; id: string }>;
}) {
  const { locale, country, id } = await params;
  const basePath = `/${locale}/${country}/founder`;

  const userId = await getGuestId();
  if (!userId) redirect(`/auth/login?next=${encodeURIComponent(`${basePath}/briefings/${id}`)}`);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!user) redirect(`/${locale}/${country}`);

  const session = await getExecutiveSession(user.id, user.role);
  if (!session) {
    return (
      <div className="rounded-2xl border border-amber-900/40 bg-black/50 p-8 text-center text-zinc-400">
        <p>Accès exécutif requis.</p>
      </div>
    );
  }

  if (!executiveDashboardFlags.executiveCompanyMetricsV1 || !founderWorkspaceFlags.weeklyExecutiveBriefingV1) {
    return (
      <div className="rounded-2xl border border-amber-900/40 bg-black/50 p-8 text-center text-zinc-400">
        <p>Briefings désactivés.</p>
      </div>
    );
  }

  const briefing = await getBriefingByIdForScope(id, session.scope, session.userId);
  if (!briefing) notFound();

  return (
    <div className="space-y-6">
      <Link href={`${basePath}/briefings`} className="text-sm text-amber-200/80 hover:underline">
        ← Briefings
      </Link>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Briefing exécutif</h1>
          <p className="text-sm text-zinc-500">
            {briefing.periodStart.toISOString().slice(0, 10)} → {briefing.periodEnd.toISOString().slice(0, 10)} ·{" "}
            {briefing.status}
          </p>
        </div>
      </div>
      <BriefingReviewBar briefingId={briefing.id} />
      <ExecutiveBriefingViewer sections={briefing.sections} />
    </div>
  );
}
