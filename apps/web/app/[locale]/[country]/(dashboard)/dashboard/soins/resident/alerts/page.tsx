import { prisma } from "@repo/db";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { SoinsAlertsListClient } from "@/components/soins/SoinsAlertsListClient";
import { SoinsFamilySubHeader } from "@/components/soins/SoinsFamilySubHeader";

export const dynamic = "force-dynamic";

export default async function SoinsResidentAlertsPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { userId } = await requireAuthenticatedUser();
  const { locale, country } = await params;
  const back = `/${locale}/${country}/dashboard/soins/resident`;

  const profile = await prisma.residentProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  const alerts = profile
    ? await prisma.careEvent.findMany({
        where: { residentId: profile.id },
        orderBy: { createdAt: "desc" },
        take: 80,
      })
    : [];

  return (
    <div className="min-h-full pb-8">
      <SoinsFamilySubHeader title="Mes alertes" backHref={back} />
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
