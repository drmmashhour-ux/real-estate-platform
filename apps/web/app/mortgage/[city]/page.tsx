import type { Metadata } from "next";
import { CityIntentLanding } from "@/components/growth/CityIntentLanding";
import { buildCityIntentMetadata } from "@/lib/growth/city-intent-seo";
import { GROWTH_CITY_SLUGS, parseGrowthCitySlugParam } from "@/lib/growth/geo-slugs";

export const revalidate = 180;

export function generateStaticParams() {
  return GROWTH_CITY_SLUGS.map((city) => ({ city }));
}

type PageProps = { params: Promise<{ city: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city } = await params;
  const slug = parseGrowthCitySlugParam(city);
  if (!slug) return { title: "Mortgage" };
  return buildCityIntentMetadata("mortgage", slug);
}

export default async function MortgageCityPage({ params }: PageProps) {
  const { city } = await params;
  return <CityIntentLanding intent="mortgage" cityParam={city} />;
}
