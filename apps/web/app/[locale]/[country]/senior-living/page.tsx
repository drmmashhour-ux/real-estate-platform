import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { SeniorLivingHomeEntry } from "@/components/senior-living/SeniorLivingHomeEntry";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  return buildPageMetadata({
    title: "Senior Living — find the right residence | LECIPM",
    description:
      "Large text, simple steps, and verified residences. Search by city or follow a short guide — built for older adults and families.",
    path: "/senior-living",
    locale,
    country,
  });
}

export default async function SeniorLivingHubPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  return <SeniorLivingHomeEntry locale={locale} country={country} />;
}
