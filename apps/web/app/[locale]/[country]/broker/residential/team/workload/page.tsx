import { PlatformRole } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import { brokerOpsFlags } from "@/config/feature-flags";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { getBrokerWorkloadSummary } from "@/modules/broker-workload/workload.service";
import { suggestRebalance } from "@/modules/broker-workload/workload-balancer.service";
import { WorkloadBoard } from "@/components/broker-team/WorkloadBoard";

export const dynamic = "force-dynamic";

export default async function BrokerTeamWorkloadPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const basePath = `/${locale}/${country}/broker/residential`;

  const userId = await getGuestId();
  if (!userId) redirect(`/auth/login?next=${encodeURIComponent(`${basePath}/team/workload`)}`);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user || (user.role !== PlatformRole.BROKER && user.role !== PlatformRole.ADMIN)) {
    redirect(`/${locale}/${country}/broker`);
  }

  if (!brokerOpsFlags.brokerWorkloadIntelligenceV1) {
    return (
      <div className="rounded-2xl border border-ds-border bg-ds-card/60 p-8 text-center">
        <p className="text-ds-text-secondary">Workload intelligence is disabled.</p>
        <p className="mt-2 text-xs text-ds-text-secondary">
          Set <code className="text-ds-gold/90">FEATURE_BROKER_WORKLOAD_INTELLIGENCE_V1=1</code> to enable.
        </p>
      </div>
    );
  }

  const summary = await getBrokerWorkloadSummary(userId, user.role);
  const suggestions = brokerOpsFlags.brokerWorkloadIntelligenceV1 ? await suggestRebalance(userId) : [];

  return (
    <div className="space-y-6">
      <Link href={`${basePath}/team`} className="text-xs text-ds-gold hover:underline">
        ← Team overview
      </Link>
      <WorkloadBoard basePath={basePath} summary={summary} suggestions={suggestions} />
    </div>
  );
}
