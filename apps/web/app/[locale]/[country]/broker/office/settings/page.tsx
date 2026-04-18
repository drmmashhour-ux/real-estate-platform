import { PlatformRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { OfficeNav } from "@/components/brokerage-office/OfficeNav";

export const dynamic = "force-dynamic";

export default async function OfficeSettingsPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const basePath = `/${locale}/${country}/broker/office`;
  const userId = await getGuestId();
  if (!userId) redirect(`/auth/login?next=${encodeURIComponent(`${basePath}/settings`)}`);
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user || (user.role !== PlatformRole.BROKER && user.role !== PlatformRole.ADMIN)) redirect(`/${locale}/${country}/broker`);

  return (
    <div className="space-y-6">
      <OfficeNav basePath={basePath} active="/settings" />
      <p className="text-sm text-zinc-400">
        PATCH <code className="text-amber-200/80">/api/broker/office/settings?officeId=…</code> with JSON configs for tax,
        commission, billing, payout.
      </p>
    </div>
  );
}
