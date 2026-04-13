import type { Metadata } from "next";
import { CityIntentLanding } from "@/components/growth/CityIntentLanding";
import { buildCityIntentMetadata } from "@/lib/growth/city-intent-seo";
import { GROWTH_CITY_SLUGS, parseGrowthCitySlugParam } from "@/lib/growth/geo-slugs";
import { RentalListingDetail } from "./rental-listing-detail";

export const revalidate = 180;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function generateStaticParams() {
  return GROWTH_CITY_SLUGS.map((city) => ({ slug: city }));
}

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (UUID_RE.test(slug)) {
    return { title: "Long-term rental | Rent Hub" };
  }
  const citySlug = parseGrowthCitySlugParam(slug);
  if (!citySlug) return { title: "Rent" };
  return buildCityIntentMetadata("rent", citySlug);
}

export default async function RentSlugPage({ params }: PageProps) {
  const { slug } = await params;
  if (UUID_RE.test(slug)) {
    return <RentalListingDetail listingId={slug} />;
  }
  return <CityIntentLanding intent="rent" cityParam={slug} />;
}
