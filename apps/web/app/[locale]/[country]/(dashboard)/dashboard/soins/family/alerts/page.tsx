import { prisma } from "@/lib/db";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { SoinsAlertsListClient } from "@/components/soins/SoinsAlertsListClient";
import { SoinsFamilySubHeader } from "@/components/soins/SoinsFamilySubHeader";

export const dynamic = "force-dynamic";

export default async function SoinsFamilyAlertsPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { userId } = await requireAuthenticatedUser();
  const { locale, country } = await params;
  const back = `/${locale}/${country}/dashboard/soins/family`;

  const link = await prisma.familyAccess.findFirst({
    where: { familyUserId: userId },
    select: { residentId: true },
  });

  const alerts = link
    ? await prisma.careEvent.findMany({
        where: { residentId: link.residentId },
        orderBy: { createdAt: "desc" },
        take: 80,
      })
    : [];

  return (
    <div className="min-h-full pb-8">
      <SoinsFamilySubHeader title="Alertes" backHref={back} />
      <SoinsAlertsListClient
        alerts={alerts.map((a) => ({
          id: a.id,
          type: a.type,
          severity: a.severity,
          message: a.message,
          createdAt: a.createdAt,
        }))}
      />
    </div>
  );
}
