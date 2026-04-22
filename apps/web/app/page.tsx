import type { Metadata } from "next";
import { LecipmLuxuryHomepage } from "@/components/marketing/LecipmLuxuryHomepage";
import { PLATFORM_NAME } from "@/lib/brand/platform";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { seoConfig } from "@/lib/seo/config";
import { OG_DEFAULT_PLATFORM } from "@/lib/seo/og-defaults";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: `${PLATFORM_NAME} — Luxury real estate intelligence | ${seoConfig.siteName}`,
    description: `${PLATFORM_NAME}: Where real estate meets intelligence — premium search, six hubs, AI-powered insights, and investor-grade controls.`,
    path: "/",
    ogImage: OG_DEFAULT_PLATFORM,
    ogImageAlt: `${PLATFORM_NAME} — luxury real estate marketplace`,
  });
}

/** Public `/` — luxury black/gold marketing (same UI as `[locale]/[country]/page.tsx`; implemented in `LecipmLuxuryHomepage`). */
export default function RootMarketingHomePage() {
  return <LecipmLuxuryHomepage />;
}
