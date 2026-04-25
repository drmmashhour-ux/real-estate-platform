import type { Metadata } from "next";
import { LecipmLuxuryHomepage } from "@/components/marketing/LecipmLuxuryHomepage";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { seoConfig } from "@/lib/seo/config";
import { OG_DEFAULT_PLATFORM } from "@/lib/seo/og-defaults";
import { PLATFORM_NAME } from "@/lib/brand/platform";

/** Public localized home — luxury black/gold marketing (same shell as `/`). */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}): Promise<Metadata> {
  const { locale, country } = await params;
  return buildPageMetadata({
    title: `${PLATFORM_NAME} — Close the right deals, faster | Québec brokers`,
    description: `Stop chasing every lead. LECIPM shows which deals matter and what to do next — built for brokers in Québec.`,
    path: "/",
    locale,
    country,
    ogImage: OG_DEFAULT_PLATFORM,
    ogImageAlt: `${PLATFORM_NAME} — broker priorities and next steps`,
  });
}

export default async function HomePage({ params }: { params: Promise<{ locale: string; country: string }> }) {
  const { locale, country } = await params;
  return <LecipmLuxuryHomepage locale={locale} country={country} />;
}
