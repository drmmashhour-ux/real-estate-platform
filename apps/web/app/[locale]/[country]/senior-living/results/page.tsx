import { Suspense } from "react";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { listResidences } from "@/modules/senior-living/residence.service";
import { SeniorLivingResultsClient } from "@/components/senior-living/SeniorLivingResultsClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  return buildPageMetadata({
    title: "Senior residences — results | LECIPM",
    description: "Browse senior living residences with clear pricing and care levels.",
    path: "/senior-living/results",
    locale,
    country,
  });
}

function ResultsFallback() {
  return (
    <div className="px-4 py-16 text-center text-lg font-semibold text-neutral-900" role="status">
      Loading results…
    </div>
  );
}

export default async function SeniorLivingResultsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; country: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale, country } = await params;
  const sp = await searchParams;
  const profileId = typeof sp.profileId === "string" ? sp.profileId.trim() : "";
  const cityRaw = sp.city;
  const city = typeof cityRaw === "string" ? cityRaw.trim() : "";

  const residences = profileId ? await listResidences({ take: 150 }) : await listResidences({ city: city || undefined, take: 100 });

  const initial = residences.map((r) => ({
    id: r.id,
    name: r.name,
    city: r.city,
    province: r.province,
    careLevel: r.careLevel,
    verified: r.verified,
    basePrice: r.basePrice,
    priceRangeMin: r.priceRangeMin,
    priceRangeMax: r.priceRangeMax,
    latitude: r.latitude ?? null,
    longitude: r.longitude ?? null,
  }));

  return (
    <Suspense fallback={<ResultsFallback />}>
      <SeniorLivingResultsClient
        locale={locale}
        country={country}
        initialResidences={initial}
        initialCityFilter={city || null}
        mapboxToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? null}
      />
    </Suspense>
  );
}
