import type { Metadata } from "next";
import { LecipmHomeLanding } from "@/components/marketing/LecipmHomeLanding";
import { HomeFeaturedListings } from "@/components/marketing/HomeFeaturedListings";
import { HomeTrustBullets } from "@/components/marketing/HomeTrustBullets";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { seoConfig } from "@/lib/seo/config";
import { OG_DEFAULT_PLATFORM } from "@/lib/seo/og-defaults";
import { PLATFORM_CARREFOUR_NAME, PLATFORM_NAME } from "@/lib/brand/platform";

/** Fallback `/` route if not rewritten by middleware — keep copy aligned with locale home. */
export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: `${PLATFORM_NAME} — Stays, homes & investments | ${seoConfig.siteName}`,
    description: `${PLATFORM_NAME} (${PLATFORM_CARREFOUR_NAME}): Find a stay, a property, or an investment in Québec — verified listings where shown, secure BNHUB checkout with Stripe.`,
    path: "/",
    ogImage: OG_DEFAULT_PLATFORM,
    ogImageAlt: `${PLATFORM_NAME} — Québec real estate platform`,
  });
}

/** Fallback `/` when not rewritten — match default locale/country segment. */
export default function HomePage() {
  return (
    <div className="flex flex-col">
      <LecipmHomeLanding />
      <HomeFeaturedListings locale="en" country="ca" />
      <HomeTrustBullets />
    </div>
  );
}
