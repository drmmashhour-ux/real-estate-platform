import { redirect } from "next/navigation";
import Link from "next/link";
import { executiveDashboardFlags, founderWorkspaceFlags, lecipmLaunchInvestorFlags } from "@/config/feature-flags";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getExecutiveSession } from "@/modules/owner-access/executive-visibility.service";
import { FounderCopilotWorkspace } from "@/components/founder/FounderCopilotWorkspace";
import { listBriefingsForScope } from "@/modules/executive-briefing/briefing-history.service";
import { BriefingSummaryCard } from "@/components/executive-briefing/BriefingSummaryCard";

export const dynamic = "force-dynamic";

export default async function FounderWorkspacePage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const basePath = `/${locale}/${country}/founder`;

  const userId = await getGuestId();
  if (!userId) redirect(`/auth/login?next=${encodeURIComponent(basePath)}`);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!user) redirect(`/${locale}/${country}`);

  const session = await getExecutiveSession(user.id, user.role);
  if (!session) {
    return (
      <div className="rounded-2xl border border-amber-900/40 bg-black/50 p-8 text-center text-zinc-400">
        <p>Accès réservé aux dirigeants de bureau résidentiel ou administrateurs plateforme.</p>
      </div>
    );
  }

  if (!executiveDashboardFlags.executiveCompanyMetricsV1 || !founderWorkspaceFlags.founderAiCopilotV1) {
    return (
      <div className="rounded-2xl border border-amber-900/40 bg-black/50 p-8 text-center text-zinc-400">
        <p>Espace fondateur désactivé.</p>
        <p className="mt-2 text-xs">
          <code className="text-amber-200/90">FEATURE_EXECUTIVE_COMPANY_METRICS_V1</code> +{" "}
          <code className="text-amber-200/90">FEATURE_FOUNDER_AI_COPILOT_V1</code>
        </p>
      </div>
    );
  }

  const briefings =
    founderWorkspaceFlags.weeklyExecutiveBriefingV1
      ? await listBriefingsForScope(session.scope, session.userId, 3)
      : [];
  const latest = briefings[0];

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2 border-b border-zinc-800 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-amber-200/80">LECIPM · résidentiel</p>
          <h1 className="text-2xl font-semibold text-zinc-50">Espace fondateur</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Copilote exécutif et briefings — synthèses vérifiables, sans causes inventées.
          </p>
        </div>
        <nav className="flex flex-wrap gap-3 text-sm">
          <Link className="text-amber-200/90 hover:underline" href={`${basePath}/copilot`}>
            Copilote
          </Link>
          <Link className="text-amber-200/90 hover:underline" href={`${basePath}/briefings`}>
            Briefings
          </Link>
          {lecipmLaunchInvestorFlags.lecipmLaunchInvestorSystemV1 ? (
            <Link className="text-emerald-300/90 hover:underline" href={`${basePath}/launch`}>
              Launch & investisseurs
            </Link>
          ) : null}
        </nav>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        {latest ? (
          <BriefingSummaryCard
            periodStart={latest.periodStart}
            periodEnd={latest.periodEnd}
            status={latest.status}
          />
        ) : (
          <div className="rounded-2xl border border-zinc-800 p-4 text-sm text-zinc-500">
            Aucun briefing archivé — générez-en un depuis l’onglet Briefings.
          </div>
        )}
      </section>

      <FounderCopilotWorkspace />
    </div>
  );
}
