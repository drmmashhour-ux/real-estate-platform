import { PlatformRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { brokerResidentialFlags } from "@/config/feature-flags";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { BrokerCopilotPanel } from "@/components/broker-residential/BrokerCopilotPanel";
import { BrokerKPIBar } from "@/components/broker-residential/BrokerKPIBar";
import { BrokerPriorityQueue } from "@/components/broker-residential/BrokerPriorityQueue";
import { BrokerRiskPanel } from "@/components/broker-residential/BrokerRiskPanel";
import { getResidentialDashboardPayload } from "@/modules/broker-residential-copilot/broker-residential-copilot.service";
import { getResidentialKnowledgeIndex } from "@/modules/broker-residential-knowledge/residential-knowledge.service";

export const dynamic = "force-dynamic";

export default async function BrokerResidentialHomePage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const basePath = `/${locale}/${country}/broker/residential`;

  const userId = await getGuestId();
  if (!userId) redirect(`/auth/login?next=${encodeURIComponent(basePath)}`);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user || (user.role !== PlatformRole.BROKER && user.role !== PlatformRole.ADMIN)) {
    redirect(`/${locale}/${country}/broker`);
  }

  if (!brokerResidentialFlags.brokerResidentialDashboardV1) {
    return (
      <div className="rounded-2xl border border-ds-border bg-ds-card/60 p-8 text-center">
        <p className="text-ds-text-secondary">Residential broker dashboard is disabled.</p>
        <p className="mt-2 text-xs text-ds-text-secondary">
          Set <code className="text-ds-gold/90">FEATURE_BROKER_RESIDENTIAL_DASHBOARD_V1=1</code> to enable.
        </p>
      </div>
    );
  }

  const dashboard = await getResidentialDashboardPayload(userId, basePath);
  const knowledge =
    brokerResidentialFlags.residentialKnowledgeHooksV1 ? await getResidentialKnowledgeIndex() : null;

  const riskLines = [
    "Verify identities against your brokerage KYC before any commitment.",
    "Use publisher-issued OACIQ forms — do not substitute with platform drafts for execution.",
  ];

  return (
    <div className="space-y-8">
      <BrokerKPIBar kpis={dashboard.kpis} />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <BrokerPriorityQueue items={dashboard.priorities} basePath={basePath} />
          <p className="text-xs text-ds-text-secondary">{dashboard.disclaimer}</p>
        </div>
        <div className="space-y-6">
          <BrokerCopilotPanel />
          <BrokerRiskPanel lines={riskLines} />
          {knowledge && (
            <div className="rounded-2xl border border-ds-border bg-ds-card/60 p-5 text-sm text-ds-text-secondary shadow-ds-soft">
              <h3 className="font-medium text-ds-text">Knowledge hooks</h3>
              <p className="mt-2 text-xs">{knowledge.disclaimer}</p>
              <p className="mt-2 text-xs">
                Clause refs loaded: {knowledge.clauseRefs.length} · Drafting sources: {knowledge.draftingSources.length} ·
                Ingestions registered: {knowledge.registeredIngestions}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
