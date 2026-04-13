import type { Metadata } from "next";
import { FeaturedListings } from "@/components/bnhub/FeaturedListings";
import { SponsoredListings } from "@/components/bnhub/SponsoredListings";
import { BnhubPersonalizedForYou } from "@/components/bnhub/BnhubPersonalizedForYou";
import { StaysGuestBookingDashboard } from "@/components/bnhub/stays-guest-booking-dashboard";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { seoConfig } from "@/lib/seo/config";
import { OG_DEFAULT_BNHUB } from "@/lib/seo/og-defaults";
import { getGuestId } from "@/lib/auth/session";

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

export default async function BNHubStaysPage() {
  const guestId = await getGuestId();
  return (
    <>
      {guestId ? <BnhubPersonalizedForYou userId={guestId} /> : null}
      <StaysGuestBookingDashboard activeMode="stays">
        <FeaturedListings variant="booking" />
        <SponsoredListings variant="booking" />
      </StaysGuestBookingDashboard>
    </>
  );
}
