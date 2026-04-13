import type { Metadata } from "next";
import { BnhubCityStaysSeoLanding } from "@/components/seo/BnhubCityStaysSeoLanding";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { OG_DEFAULT_BNHUB } from "@/lib/seo/og-defaults";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}): Promise<Metadata> {
  const { locale, country } = await params;
  return buildPageMetadata({
    title: "Laval short-term stays & nightly rentals | BNHUB | LECIPM",
    description:
      "Find verified BNHUB short-term stays in Laval, Quebec. See nightly pricing, explore listings by city, and book or contact LECIPM for guest support.",
    path: "/bnhub/laval",
    locale,
    country,
    ogImage: OG_DEFAULT_BNHUB,
    ogImageAlt: "Laval short-term stays on BNHUB",
    keywords: [
      "Laval short term rental",
      "Laval vacation rental",
      "BNHUB Laval",
      "nightly stay Laval",
      "LECIPM",
    ],
  });
}

export default function LavalBnhubSeoPage() {
  return <BnhubCityStaysSeoLanding citySlug="laval" canonicalPath="/bnhub/laval" />;
}
