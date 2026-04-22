import { SoinsBrowseClient } from "@/components/soins/SoinsBrowseClient";
import type { SoinsResidenceCardVm } from "@/components/soins/SoinsResidenceCard";
import { listCareResidences } from "@/modules/soins/soins-residence.service";

export const dynamic = "force-dynamic";

export default async function SoinsHubHomePage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;

  const rows = await listCareResidences().catch(() => []);

  const residences: SoinsResidenceCardVm[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    city: r.city,
    type: r.type,
    basePrice: r.basePrice,
    description: r.description,
    serviceCategories: [...new Set(r.services.map((s) => s.type))],
  }));

  return (
    <>
      <section className="border-b border-[#D4AF37]/15 bg-gradient-to-b from-black via-[#080808] to-[#050505] px-4 pb-14 pt-12 text-center md:pb-16 md:pt-16">
        <p className="text-[11px] uppercase tracking-[0.38em] text-[#D4AF37]/75">LECIPM · Soins</p>
        <h1 className="mx-auto mt-4 max-w-3xl font-serif text-4xl font-semibold tracking-tight text-white md:text-5xl">
          Des résidences claires pour votre famille
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-[17px] leading-relaxed text-white/55">
          Contraste élevé, navigation simple, tarifs transparents — pensé pour les proches comme pour les résidents.
        </p>
      </section>
      <SoinsBrowseClient residences={residences} locale={locale} country={country} />
    </>
  );
}
