import { PlatformRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { OfficeNav } from "@/components/brokerage-office/OfficeNav";

export const dynamic = "force-dynamic";

export default async function OfficeTeamPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const basePath = `/${locale}/${country}/broker/office`;
  const userId = await getGuestId();
  if (!userId) redirect(`/auth/login?next=${encodeURIComponent(`${basePath}/team`)}`);
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user || (user.role !== PlatformRole.BROKER && user.role !== PlatformRole.ADMIN)) redirect(`/${locale}/${country}/broker`);

  return (
    <div className="space-y-6">
      <OfficeNav basePath={basePath} active="/team" />
      <p className="text-sm text-zinc-400">
        Teams are listed via <code className="text-amber-200/80">GET /api/broker/office/roster</code>. UI table wiring can extend
        this page.
      </p>
    </div>
  );
}
