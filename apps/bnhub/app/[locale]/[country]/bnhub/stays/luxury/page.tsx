import type { Metadata } from "next";
import { BNHubLuxuryStaysPage } from "@/components/bnhub/BNHubLuxuryStaysPage";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { seoConfig } from "@/lib/seo/config";
import { OG_DEFAULT_BNHUB } from "@/lib/seo/og-defaults";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}): Promise<Metadata> {
  const { locale, country } = await params;
  return buildPageMetadata({
    title: `Luxury stays | BNHub | ${seoConfig.siteName}`,
    description: `Premium short-term stays preview — refined presentation on ${seoConfig.siteName}. Use full BNHub search for live inventory.`,
    path: "/bnhub/stays/luxury",
    locale,
    country,
    ogImage: OG_DEFAULT_BNHUB,
    ogImageAlt: "Luxury BNHub stays preview",
  });
}

export default async function BNHubLuxuryStaysRoute({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  return <BNHubLuxuryStaysPage locale={locale} country={country} />;
}
