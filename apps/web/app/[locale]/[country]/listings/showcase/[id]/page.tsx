import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LecipmLuxuryListingDetailShowcase } from "@/components/listings/LecipmLuxuryListingDetailShowcase";
import { getLuxuryShowcaseProperty } from "@/components/listings/luxury-showcase-data";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { seoConfig } from "@/lib/seo/config";
import { OG_DEFAULT_LISTINGS } from "@/lib/seo/og-defaults";

type Props = {
  params: Promise<{ locale: string; country: string; id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, country, id } = await params;
  const p = getLuxuryShowcaseProperty(id);
  if (!p) {
    return buildPageMetadata({
      title: `Listing | ${seoConfig.siteName}`,
      description: `Property details on ${seoConfig.siteName}.`,
      path: `/listings/showcase/${id}`,
      locale,
      country,
      noindex: true,
    });
  }
  return buildPageMetadata({
    title: `${p.title} | ${seoConfig.siteName}`,
    description: p.description.slice(0, 155),
    path: `/listings/showcase/${id}`,
    locale,
    country,
    ogImage: OG_DEFAULT_LISTINGS,
    ogImageAlt: p.title,
  });
}

export default async function LuxuryShowcaseListingPage({ params }: Props) {
  const { locale, country, id } = await params;
  const property = getLuxuryShowcaseProperty(id);
  if (!property) notFound();

  const base = `/${locale}/${country}`;
  return <LecipmLuxuryListingDetailShowcase base={base} property={property} />;
}
