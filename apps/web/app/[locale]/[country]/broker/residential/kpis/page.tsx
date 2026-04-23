import { PlatformRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { brokerOpsFlags } from "@/config/feature-flags";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { getBrokerKpiBoardSnapshot } from "@/modules/broker-kpis/broker-kpi.service";
import { BrokerKPIBoard } from "@/components/broker-kpis/BrokerKPIBoard";

export const dynamic = "force-dynamic";

export default async function BrokerKpisPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const basePath = `/${locale}/${country}/broker/residential`;

  const userId = await getGuestId();
  if (!userId) redirect(`/auth/login?next=${encodeURIComponent(`${basePath}/kpis`)}`);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user || (user.role !== PlatformRole.BROKER && user.role !== PlatformRole.ADMIN)) {
    redirect(`/${locale}/${country}/broker`);
  }

  if (!brokerOpsFlags.brokerKpiBoardV1) {
    return (
      <div className="rounded-2xl border border-ds-border bg-ds-card/60 p-8 text-center">
        <p className="text-ds-text-secondary">Broker KPI board is disabled.</p>
        <p className="mt-2 text-xs text-ds-text-secondary">
          Set <code className="text-ds-gold/90">FEATURE_BROKER_KPI_BOARD_V1=1</code> to enable.
        </p>
      </div>
    );
  }

  const snapshot = await getBrokerKpiBoardSnapshot(userId, "30d");

  return <BrokerKPIBoard basePath={basePath} snapshot={snapshot} />;
}
