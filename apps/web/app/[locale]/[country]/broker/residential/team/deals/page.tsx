import { PlatformRole } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import { brokerOpsFlags } from "@/config/feature-flags";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { TeamDealBoard } from "@/components/broker-team/TeamDealBoard";

export const dynamic = "force-dynamic";

export default async function BrokerTeamDealsPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const basePath = `/${locale}/${country}/broker/residential`;

  const userId = await getGuestId();
  if (!userId) redirect(`/auth/login?next=${encodeURIComponent(`${basePath}/team/deals`)}`);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user || (user.role !== PlatformRole.BROKER && user.role !== PlatformRole.ADMIN)) {
    redirect(`/${locale}/${country}/broker`);
  }

  if (!brokerOpsFlags.brokerageTeamCollabV1) {
    return <p className="text-sm text-ds-text-secondary">Team collaboration disabled.</p>;
  }

  const deals = await prisma.deal.findMany({
    where: { brokerId: userId, status: { notIn: ["closed", "cancelled"] } },
    select: {
      id: true,
      dealCode: true,
      status: true,
      crmStage: true,
      updatedAt: true,
      brokerDealAssignments: { where: { status: "active" }, take: 5 },
    },
    orderBy: { updatedAt: "desc" },
    take: 40,
  });

  return (
    <div className="space-y-6">
      <Link href={`${basePath}/team`} className="text-xs text-ds-gold hover:underline">
        ← Team overview
      </Link>
      <TeamDealBoard basePath={basePath} deals={deals} />
    </div>
  );
}
