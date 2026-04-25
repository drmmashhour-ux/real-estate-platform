import type { Metadata } from "next";
import { BnhubListingView } from "@/app/[locale]/[country]/bnhub/bnhub-listing-view";
import { BnhubLuxuryStayDetailShowcase } from "@/components/bnhub/BnhubLuxuryStayDetailShowcase";
import { getLuxuryBnhubStayShowcase } from "@/components/bnhub/bnhub-luxury-stay-showcase-data";
import { hasAdUtmParams } from "@/lib/marketing/bnhub-ad-landing-url";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { seoConfig } from "@/lib/seo/config";
import { OG_DEFAULT_BNHUB } from "@/lib/seo/og-defaults";

export const dynamic = "force-dynamic";

/** Public stay detail — `/bnhub/stays/[id]` (listing id/code, or luxury showcase slug). */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; country: string; id: string }>;
}): Promise<Metadata> {
  const { locale, country, id } = await params;
  const showcase = getLuxuryBnhubStayShowcase(id);
  if (showcase) {
    return buildPageMetadata({
      title: `${showcase.title} | BNHub | ${seoConfig.siteName}`,
      description: showcase.description.slice(0, 155),
      path: `/bnhub/stays/${encodeURIComponent(id)}`,
      locale,
      country,
      ogImage: OG_DEFAULT_BNHUB,
      ogImageAlt: showcase.title,
    });
  }
  return buildPageMetadata({
    title: `Stay | BNHub | ${seoConfig.siteName}`,
    description: `Short-term stay on ${seoConfig.siteName}.`,
    path: `/bnhub/stays/${encodeURIComponent(id)}`,
    locale,
    country,
    ogImage: OG_DEFAULT_BNHUB,
  });
}

export default async function BnhubStayDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; country: string; id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale, country, id } = await params;
  const showcase = getLuxuryBnhubStayShowcase(id);
  if (showcase) {
    const base = `/${locale}/${country}`;
    return <BnhubLuxuryStayDetailShowcase base={base} stay={showcase} />;
  }

  const sp = (await searchParams) ?? {};
  const checkIn = typeof sp.checkIn === "string" ? sp.checkIn : undefined;
  const checkOut = typeof sp.checkOut === "string" ? sp.checkOut : undefined;
  const guests = typeof sp.guests === "string" ? sp.guests : undefined;
  const prefill =
    checkIn != null || checkOut != null || guests != null ? { checkIn, checkOut, guests } : undefined;
  return (
    <BnhubListingView
      routeLookupKey={id}
      seoCanonicalPath={`/bnhub/stays/${encodeURIComponent(id)}`}
      prefill={prefill}
      adLanding={hasAdUtmParams(sp)}
    />
  );
}
