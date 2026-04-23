import { prisma } from "@repo/db";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { SoinsResidentDashboardClient } from "@/components/soins/SoinsResidentDashboardClient";
import { urgencyFromSeverity } from "@/design-system/soins-hub";
import type { SoinsUrgencyLevel } from "@/design-system/soins-hub";

export const dynamic = "force-dynamic";

function mapUrgency(s: string): SoinsUrgencyLevel {
  return urgencyFromSeverity(s);
}

function statusLabelFr(level: SoinsUrgencyLevel): string {
  if (level === "emergency") return "Situation à vérifier";
  if (level === "attention") return "À suivre";
  return "Tout est calme";
}

export default async function SoinsResidentDashboardPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { userId } = await requireAuthenticatedUser();
  const { locale, country } = await params;
  const basePath = `/${locale}/${country}/dashboard/soins/resident`;

  const profile = await prisma.residentProfile.findUnique({
    where: { userId },
    include: {
      residence: true,
      user: { select: { name: true, email: true } },
    },
  });

  if (!profile) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="font-serif text-2xl text-white">Aucun profil résident</h1>
        <p className="mt-4 text-[17px] text-white/55">
          Votre compte n’est pas encore lié à une résidence. Parcourez le catalogue Soins.
        </p>
        <a
          className="mt-8 inline-block rounded-2xl bg-[#D4AF37] px-6 py-3 font-semibold text-black"
          href={`/${locale}/${country}/soins`}
        >
          Voir les résidences
        </a>
      </div>
    );
  }

  const events = await prisma.careEvent.findMany({
    where: { residentId: profile.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const top = events[0];
  const level = top ? mapUrgency(top.severity) : "normal";

  const todaySummary =
    events.length === 0
      ? "Aucun événement enregistré aujourd’hui. L’équipe met à jour ce résumé au fil de la journée."
      : `Dernière mise à jour : ${events[0]?.message ?? "—"}`;

  return (
    <SoinsResidentDashboardClient
      vm={{
        residentName: profile.user.name ?? profile.user.email ?? "Résident",
        residenceTitle: profile.residence.title,
        city: profile.residence.city,
        statusLevel: level,
        statusLabel: statusLabelFr(level),
        todaySummary,
        alerts: events.map((e) => ({
          id: e.id,
          type: e.type,
          severity: e.severity,
          message: e.message,
          createdAt: e.createdAt.toISOString(),
        })),
        basePath,
      }}
    />
  );
}
