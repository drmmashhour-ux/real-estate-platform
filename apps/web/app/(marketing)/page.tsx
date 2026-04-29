import type { Metadata } from "next";
import LuxuryLandingPage from "@/components/landing/LuxuryLandingPage";
import { PLATFORM_NAME } from "@/lib/brand/platform";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { OG_DEFAULT_PLATFORM } from "@/lib/seo/og-defaults";
import { DEFAULT_COUNTRY_SLUG } from "@/config/countries";
import { routing } from "@/i18n/routing";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: `${PLATFORM_NAME} — Where prestige meets smart real estate | Québec`,
    description: `Discover, analyze, and invest in real estate with AI-powered insights and luxury-level precision.`,
    path: "/",
    ogImage: OG_DEFAULT_PLATFORM,
    ogImageAlt: `${PLATFORM_NAME} — Québec real estate intelligence`,
  });
}

export default function Page() {
  return (
    <LuxuryLandingPage
      basePath={`/${routing.defaultLocale}/${DEFAULT_COUNTRY_SLUG}`}
      standaloneFooter
    />
  );
}
