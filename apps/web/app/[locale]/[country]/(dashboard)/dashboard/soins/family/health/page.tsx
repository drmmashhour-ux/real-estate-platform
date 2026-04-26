import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { StatusBadge } from "@/components/soins/StatusBadge";
import { SoinsFamilySubHeader } from "@/components/soins/SoinsFamilySubHeader";
import { urgencyFromSeverity } from "@/design-system/soins-hub";

export const dynamic = "force-dynamic";

export default async function SoinsFamilyHealthPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { userId } = await requireAuthenticatedUser();
  const { locale, country } = await params;
  const back = `/${locale}/${country}/dashboard/soins/family`;

  const link = await prisma.familyAccess.findFirst({
    where: { familyUserId: userId },
    include: {
      resident: {
        include: {
          residence: true,
          careEvents: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
  });

  const ev = link?.resident.careEvents[0];
  const level = ev ? urgencyFromSeverity(ev.severity) : "normal";

  return (
    <div className="min-h-full pb-8">
      <SoinsFamilySubHeader title="État de santé" backHref={back} />
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
        <div className="flex flex-wrap items-center gap-4">
          <StatusBadge level={level} label={ev ? "Dernière alerte liée" : "Aucun signal récent"} />
        </div>
        <div className="rounded-3xl border border-[#D4AF37]/18 bg-[#0D0D0D] p-6 text-[17px] leading-relaxed text-white/80">
          {link ? (
            <>
              <p>
                Vue résumée pour <span className="text-[#D4AF37]">{link.resident.residence.title}</span>.
              </p>
              <p className="mt-4 text-white/55">
                Les informations cliniques détaillées sont communiquées par l’établissement. Ce panneau indique
                uniquement le niveau d’attention basé sur les derniers événements enregistrés.
              </p>
            </>
          ) : (
            <p>Aucune donnée.</p>
          )}
        </div>
      </div>
    </div>
  );
}
