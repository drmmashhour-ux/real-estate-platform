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
    title: "Montreal short-term stays & nightly rentals | BNHUB | LECIPM",
    description:
      "Browse verified BNHUB vacation rentals in Montreal, QC. Compare nightly rates, search by dates on the map, and book short stays securely on LECIPM.",
    path: "/bnhub/montreal",
    locale,
    country,
    ogImage: OG_DEFAULT_BNHUB,
    ogImageAlt: "Montreal short-term stays on BNHUB",
    keywords: [
      "Montreal short term rental",
      "Montreal vacation rental",
      "BNHUB Montreal",
      "nightly stay Montreal",
      "LECIPM",
    ],
  });
}

export default function MontrealBnhubSeoPage() {
  return <BnhubCityStaysSeoLanding citySlug="montreal" canonicalPath="/bnhub/montreal" />;
}
