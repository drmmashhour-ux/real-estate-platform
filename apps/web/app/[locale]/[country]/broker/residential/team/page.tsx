import { PlatformRole } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import { brokerOpsFlags } from "@/config/feature-flags";
import { getGuestId } from "@/lib/auth/session";
import { brokerWorkspaceAuditKeys, logBrokerWorkspaceEvent } from "@/lib/broker/broker-workspace-audit";
import { prisma } from "@/lib/db";
import { TeamWorkspace } from "@/components/broker-team/TeamWorkspace";

export const dynamic = "force-dynamic";

export default async function BrokerTeamPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const basePath = `/${locale}/${country}/broker/residential`;

  const userId = await getGuestId();
  if (!userId) redirect(`/auth/login?next=${encodeURIComponent(`${basePath}/team`)}`);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user || (user.role !== PlatformRole.BROKER && user.role !== PlatformRole.ADMIN)) {
    redirect(`/${locale}/${country}/broker`);
  }

  if (!brokerOpsFlags.brokerageTeamCollabV1) {
    return (
      <div className="rounded-2xl border border-ds-border bg-ds-card/60 p-8 text-center">
        <p className="text-ds-text-secondary">Brokerage team collaboration is disabled.</p>
        <p className="mt-2 text-xs text-ds-text-secondary">
          Set <code className="text-ds-gold/90">FEATURE_BROKERAGE_TEAM_COLLAB_V1=1</code> to enable.
        </p>
      </div>
    );
  }

  const teams = await prisma.brokerTeam.findMany({
    where: {
      OR: [{ ownerBrokerId: userId }, { members: { some: { userId } } }],
    },
    include: { members: { take: 20 } },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });

  await logBrokerWorkspaceEvent({
    actorUserId: userId,
    actionKey: brokerWorkspaceAuditKeys.teamWorkspaceViewed,
    payload: { teamCount: teams.length },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ds-gold/90">Internal ops</p>
          <h2 className="font-serif text-2xl text-ds-text">Team workspace</h2>
          <p className="mt-1 max-w-xl text-xs text-ds-text-secondary">
            Collaboration threads and assignments stay inside your brokerage perimeter — never exposed to clients.
          </p>
        </div>
        <Link
          href={`${basePath}/team/workload`}
          className="rounded-lg border border-ds-border px-4 py-2 text-xs text-ds-gold hover:bg-white/5"
        >
          Workload →
        </Link>
      </div>
      <TeamWorkspace basePath={basePath} teams={teams} />
    </div>
  );
}
