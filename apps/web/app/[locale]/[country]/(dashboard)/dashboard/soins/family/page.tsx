import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { SoinsFamilyHomeClient } from "@/components/soins/SoinsFamilyHomeClient";
import { FamilyPremiumSubscriptionBanner } from "@/components/soins/FamilyPremiumSubscriptionBanner";

export const dynamic = "force-dynamic";

export default async function SoinsFamilyDashboardPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { userId } = await requireAuthenticatedUser();
  const { locale, country } = await params;

  const link = await prisma.familyAccess.findFirst({
    where: { familyUserId: userId },
    include: {
      resident: {
        include: {
          residence: true,
          user: { select: { name: true, email: true } },
        },
      },
    },
  });

  if (!link) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="font-serif text-2xl text-white">Accès famille</h1>
        <p className="mt-4 text-[17px] text-white/55">
          Aucun profil résident ne vous est associé pour le moment.
        </p>
      </div>
    );
  }

  const basePath = `/${locale}/${country}/dashboard/soins/family`;
  const catalogHref = `/${locale}/${country}/soins`;

  return (
    <>
      <FamilyPremiumSubscriptionBanner locale={locale} country={country} userId={userId} />
      <SoinsFamilyHomeClient
        residentLabel={link.resident.user.name ?? link.resident.user.email ?? "Proche"}
        residenceTitle={link.resident.residence.title}
        basePath={basePath}
        catalogHref={catalogHref}
      />
    </>
  );
}
