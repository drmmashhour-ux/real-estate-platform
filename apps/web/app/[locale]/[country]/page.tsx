import type { Metadata } from "next";
import { LecipmHomeLanding } from "@/components/marketing/LecipmHomeLanding";
import { HomeFeaturedListings } from "@/components/marketing/HomeFeaturedListings";
import { HomeBnhubRecommendationRails } from "@/components/marketing/HomeBnhubRecommendationRails";
import { HomeTrustBullets } from "@/components/marketing/HomeTrustBullets";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { seoConfig } from "@/lib/seo/config";
import { OG_DEFAULT_PLATFORM } from "@/lib/seo/og-defaults";
import { PLATFORM_CARREFOUR_NAME, PLATFORM_NAME } from "@/lib/brand/platform";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { getExperimentBrowserSessionId } from "@/lib/experiments/browser-session";
import { EXPERIMENT_SURFACES } from "@/lib/experiments/constants";
import { resolveExperimentSurface } from "@/lib/experiments/get-variant-config";
import { marketingLandingFlags } from "@/config/feature-flags";
import { LecipmLeadCaptureLanding } from "@/components/marketing/LecipmLeadCaptureLanding";

/** Public home — soft-launch landing: single search + trust. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}): Promise<Metadata> {
  const { locale, country } = await params;
  return buildPageMetadata({
    title: `${PLATFORM_NAME} — Stays, homes & investments | ${seoConfig.siteName}`,
    description: `${PLATFORM_NAME} (${PLATFORM_CARREFOUR_NAME}): Find a stay, a property, or an investment in Québec — verified listings where shown, secure BNHUB checkout with Stripe.`,
    path: "/",
    locale,
    country,
    ogImage: OG_DEFAULT_PLATFORM,
    ogImageAlt: `${PLATFORM_NAME} — Québec real estate platform`,
  });
}

export default async function HomePage({ params }: { params: Promise<{ locale: string; country: string }> }) {
  const { locale, country } = await params;

  if (marketingLandingFlags.landingV1) {
    return <LecipmLeadCaptureLanding locale={locale} country={country} />;
  }

  const sessionId = await getExperimentBrowserSessionId();
  const userId = await getGuestId();
  const [heroExperiment, searchExperiment] = await Promise.all([
    resolveExperimentSurface(prisma, EXPERIMENT_SURFACES.LECIPM_HOME_HERO, { sessionId, userId }),
    resolveExperimentSurface(prisma, EXPERIMENT_SURFACES.LECIPM_HOME_SEARCH_CTA, { sessionId, userId }),
  ]);
  /** Order: Hero → Search (`LecipmHomeLanding`) → Featured → Trust → Footer (`layout`). */
  return (
    <div className="flex flex-col">
      <LecipmHomeLanding heroExperiment={heroExperiment} searchExperiment={searchExperiment} />
      <HomeFeaturedListings locale={locale} country={country} />
      <HomeBnhubRecommendationRails locale={locale} country={country} />
      <HomeTrustBullets />
    </div>
  );
}
