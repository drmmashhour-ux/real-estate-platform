import { PlatformRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { brokerageOfficeFlags } from "@/config/feature-flags";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { OfficeNav } from "@/components/brokerage-office/OfficeNav";
import { BillingDashboard } from "@/components/billing/BillingDashboard";

export const dynamic = "force-dynamic";

export default async function OfficeBillingPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const basePath = `/${locale}/${country}/broker/office`;
  const userId = await getGuestId();
  if (!userId) redirect(`/auth/login?next=${encodeURIComponent(`${basePath}/billing`)}`);
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user || (user.role !== PlatformRole.BROKER && user.role !== PlatformRole.ADMIN)) redirect(`/${locale}/${country}/broker`);

  if (!brokerageOfficeFlags.brokerageBillingV1) {
    return <p className="text-zinc-500">Enable FEATURE_BROKERAGE_BILLING_V1</p>;
  }

  return (
    <div className="space-y-6">
      <OfficeNav basePath={basePath} active="/billing" />
      <BillingDashboard />
    </div>
  );
}
