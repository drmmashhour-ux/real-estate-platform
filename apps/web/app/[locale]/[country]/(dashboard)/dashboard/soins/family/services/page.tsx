import { prisma } from "@/lib/db";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { SoinsFamilySubHeader } from "@/components/soins/SoinsFamilySubHeader";

export const dynamic = "force-dynamic";

export default async function SoinsFamilyServicesPage({
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
          residence: { include: { services: true, foodPlans: true } },
          foodPlan: true,
        },
      },
    },
  });

  const fp = link?.resident.foodPlan;

  return (
    <div className="min-h-full pb-8">
      <SoinsFamilySubHeader title="Services & repas" backHref={back} />
      <div className="mx-auto max-w-2xl space-y-8 px-4 py-8">
        <section className="rounded-3xl border border-white/10 bg-[#0D0D0D] p-6">
          <h2 className="text-lg font-semibold text-[#D4AF37]">Formule repas</h2>
          <p className="mt-3 text-[17px] text-white/75">
            {fp
              ? `${fp.name.replace(/_/g, " ")} · ${fp.mealsPerDay} repas / jour`
              : "Non défini — voir avec l’établissement."}
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-[#D4AF37]">Services disponibles</h2>
          <ul className="mt-4 space-y-3">
            {!link?.resident.residence.services.length ? (
              <li className="text-white/45">Aucune donnée catalogue.</li>
            ) : (
              link.resident.residence.services.map((s) => (
                <li
                  key={s.id}
                  className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-[17px] text-white/85"
                >
                  <span className="font-medium text-white">{s.name}</span>
                  <span className="ml-2 text-sm text-white/45">{s.type}</span>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
