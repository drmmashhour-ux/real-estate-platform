import { PlatformRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { brokerageOfficeFlags } from "@/config/feature-flags";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { OfficeNav } from "@/components/brokerage-office/OfficeNav";
import { PayoutDashboard } from "@/components/payouts/PayoutDashboard";

export const dynamic = "force-dynamic";

export default async function OfficePayoutsPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const basePath = `/${locale}/${country}/broker/office`;
  const userId = await getGuestId();
  if (!userId) redirect(`/auth/login?next=${encodeURIComponent(`${basePath}/payouts`)}`);
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user || (user.role !== PlatformRole.BROKER && user.role !== PlatformRole.ADMIN)) redirect(`/${locale}/${country}/broker`);

  if (!brokerageOfficeFlags.brokerPayoutsV1) {
    return <p className="text-zinc-500">Enable FEATURE_BROKER_PAYOUTS_V1</p>;
  }

  return (
    <div className="space-y-6">
      <OfficeNav basePath={basePath} active="/payouts" />
      <PayoutDashboard />
    </div>
  );
}
