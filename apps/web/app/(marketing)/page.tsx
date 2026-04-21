import type { Metadata } from "next";
import { LecipmLeadCaptureLanding } from "@/components/marketing/LecipmLeadCaptureLanding";
import { PLATFORM_NAME } from "@/lib/brand/platform";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { seoConfig } from "@/lib/seo/config";
import { OG_DEFAULT_PLATFORM } from "@/lib/seo/og-defaults";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: `${PLATFORM_NAME} — AI listing optimization & deal intelligence | ${seoConfig.siteName}`,
    description: `${PLATFORM_NAME}: List once, optimize with AI, and close faster — AI listing assistant, deal intelligence, compliance signals, and lead capture for brokers.`,
    path: "/",
    ogImage: OG_DEFAULT_PLATFORM,
    ogImageAlt: `${PLATFORM_NAME} — AI-powered real estate workflow`,
  });
}

/** Public `/` landing — optimized for broker acquisition and lead capture (mirrors localized home when FEATURE_LANDING_V1 is on). */
export default function MarketingHomePage() {
  return <LecipmLeadCaptureLanding />;
}
