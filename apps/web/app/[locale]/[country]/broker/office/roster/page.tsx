import { PlatformRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { OfficeNav } from "@/components/brokerage-office/OfficeNav";

export const dynamic = "force-dynamic";

export default async function OfficeRosterPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const basePath = `/${locale}/${country}/broker/office`;
  const userId = await getGuestId();
  if (!userId) redirect(`/auth/login?next=${encodeURIComponent(`${basePath}/roster`)}`);
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user || (user.role !== PlatformRole.BROKER && user.role !== PlatformRole.ADMIN)) redirect(`/${locale}/${country}/broker`);

  return (
    <div className="space-y-6">
      <OfficeNav basePath={basePath} active="/roster" />
      <p className="text-sm text-zinc-400">Roster API: GET /api/broker/office/roster?officeId=…</p>
    </div>
  );
}
