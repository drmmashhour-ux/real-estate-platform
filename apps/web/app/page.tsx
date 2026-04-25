import type { Metadata } from "next";
import { LecipmLuxuryHomepage } from "@/components/marketing/LecipmLuxuryHomepage";
import { PLATFORM_NAME } from "@/lib/brand/platform";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { seoConfig } from "@/lib/seo/config";
import { OG_DEFAULT_PLATFORM } from "@/lib/seo/og-defaults";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: `${PLATFORM_NAME} — Close the right deals, faster | Québec brokers`,
    description: `Stop chasing every lead. LECIPM shows which deals matter and what to do next — built for brokers in Québec.`,
    path: "/",
    ogImage: OG_DEFAULT_PLATFORM,
    ogImageAlt: `${PLATFORM_NAME} — broker priorities and next steps`,
  });
}

/** Public `/` — luxury black/gold marketing (same UI as `[locale]/[country]/page.tsx`; implemented in `LecipmLuxuryHomepage`). */
export default function RootMarketingHomePage() {
  return <LecipmLuxuryHomepage />;
}
