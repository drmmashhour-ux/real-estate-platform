import { PlatformRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { brokerageOfficeFlags } from "@/config/feature-flags";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { OfficeNav } from "@/components/brokerage-office/OfficeNav";
import { CommissionCaseTable } from "@/components/commission/CommissionCaseTable";

export const dynamic = "force-dynamic";

export default async function OfficeCommissionsPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const basePath = `/${locale}/${country}/broker/office`;

  const userId = await getGuestId();
  if (!userId) redirect(`/auth/login?next=${encodeURIComponent(`${basePath}/commissions`)}`);

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user || (user.role !== PlatformRole.BROKER && user.role !== PlatformRole.ADMIN)) {
    redirect(`/${locale}/${country}/broker`);
  }

  if (!brokerageOfficeFlags.commissionEngineV1) {
    return (
      <div className="rounded-2xl border border-zinc-800 p-8 text-zinc-400">
        Commission engine disabled. Enable <code className="text-amber-200/80">FEATURE_COMMISSION_ENGINE_V1</code>.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <OfficeNav basePath={basePath} active="/commissions" />
      <h2 className="text-xl font-semibold text-white">Commission cases</h2>
      <p className="text-sm text-zinc-500">
        Run calculations via POST <code className="text-xs text-amber-200/70">/api/broker/office/commissions/run</code> with{" "}
        <code className="text-xs">officeId</code>, <code className="text-xs">dealId</code>,{" "}
        <code className="text-xs">grossCommissionCents</code>.
      </p>
      <CommissionCaseTable />
    </div>
  );
}
