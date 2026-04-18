import Link from "next/link";
import { PlatformRole } from "@prisma/client";
import { notFound, redirect } from "next/navigation";
import { brokerResidentialFlags, aiContractEngineFlags, oaciqMapperFlags } from "@/config/feature-flags";
import { getGuestId } from "@/lib/auth/session";
import { requireBrokerDealAccess } from "@/lib/broker/residential-access";
import { prisma } from "@/lib/db";
import { ContractWorkspace } from "@/components/contract-engine/ContractWorkspace";
import { ExactMapperWorkspace } from "@/components/oaciq-workspace/ExactMapperWorkspace";

export const dynamic = "force-dynamic";

export default async function BrokerResidentialContractEnginePage({
  params,
}: {
  params: Promise<{ locale: string; country: string; id: string }>;
}) {
  const { locale, country, id } = await params;
  const base = `/${locale}/${country}/broker/residential`;
  const userId = await getGuestId();
  if (!userId) redirect(`/auth/login?next=${encodeURIComponent(`${base}/deals/${id}/contract`)}`);

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user || (user.role !== PlatformRole.BROKER && user.role !== PlatformRole.ADMIN)) redirect(`/${locale}/${country}/broker`);

  if (!brokerResidentialFlags.residentialDealWorkspaceV1 || !aiContractEngineFlags.brokerContractWorkspaceV1) {
    return (
      <p className="text-sm text-ds-text-secondary">
        Enable <code className="text-ds-gold/90">FEATURE_BROKER_RESIDENTIAL_DASHBOARD_V1</code> and{" "}
        <code className="text-ds-gold/90">FEATURE_BROKER_CONTRACT_WORKSPACE_V1</code> (and AI Contract Engine flags).
      </p>
    );
  }

  const dealAccess = await requireBrokerDealAccess(userId, id, user.role === PlatformRole.ADMIN);
  if (!dealAccess) notFound();

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Link href={`${base}/deals/${id}`} className="text-sm text-ds-gold hover:text-amber-200">
          ← Deal file
        </Link>
        <h2 className="font-serif text-2xl text-ds-text">AI Contract Engine</h2>
        <ContractWorkspace dealId={id} />
      </div>
      {oaciqMapperFlags.oaciqExactMapperV1 && aiContractEngineFlags.aiContractEngineV1 ? (
        <div className="space-y-3">
          <h3 className="font-serif text-xl text-ds-text">Exact OACIQ mapper v1</h3>
          <ExactMapperWorkspace dealId={id} />
        </div>
      ) : null}
    </div>
  );
}
