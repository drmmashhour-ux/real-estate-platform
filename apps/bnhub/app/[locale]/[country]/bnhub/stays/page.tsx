import type { Metadata } from "next";
import { BnhubLuxuryStaysMarketing } from "@/components/bnhub/BnhubLuxuryStaysMarketing";
import { FeaturedListings } from "@/components/bnhub/FeaturedListings";
import { SponsoredListings } from "@/components/bnhub/SponsoredListings";
import { BnhubPersonalizedForYou } from "@/components/bnhub/BnhubPersonalizedForYou";
import { StaysGuestBookingDashboard } from "@/components/bnhub/stays-guest-booking-dashboard";
import { GuestPersonalizationFeed } from "@/components/bnhub-guest/GuestPersonalizationFeed";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { seoConfig } from "@/lib/seo/config";
import { OG_DEFAULT_BNHUB } from "@/lib/seo/og-defaults";
import { getGuestId } from "@/lib/auth/session";
import { bnhubV2Flags } from "@/config/feature-flags";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}): Promise<Metadata> {
  const { locale, country } = await params;
  return buildPageMetadata({
    title: `Find short-term stays | BNHUB | ${seoConfig.siteName}`,
    description: `Search BNHUB by city, dates, and guests — verified stays, clear nightly pricing, and secure booking on ${seoConfig.siteName}.`,
    path: "/bnhub/stays",
    locale,
    country,
    ogImage: OG_DEFAULT_BNHUB,
    ogImageAlt: "Search short-term stays on BNHUB",
  });
}

export default async function BNHubStaysPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; country: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale, country } = await params;
  const sp = await searchParams;
  const viewRaw = sp.view;
  const view = typeof viewRaw === "string" ? viewRaw : Array.isArray(viewRaw) ? viewRaw[0] : undefined;

  if (view === "luxury") {
    return <BnhubLuxuryStaysMarketing locale={locale} country={country} />;
  }

  const guestId = await getGuestId();
  const basePath = `/${locale}/${country}`;
  return (
    <>
      {guestId ? <BnhubPersonalizedForYou userId={guestId} /> : null}
      {bnhubV2Flags.bnhubV2 ? (
        <div className="mx-auto max-w-7xl px-4 pb-6 pt-2">
          <GuestPersonalizationFeed basePath={basePath} />
        </div>
      ) : null}
      <StaysGuestBookingDashboard activeMode="stays">
        <FeaturedListings variant="booking" />
        <SponsoredListings variant="booking" />
      </StaysGuestBookingDashboard>
    </>
  );
}
