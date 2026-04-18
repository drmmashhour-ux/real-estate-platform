import type { Metadata } from "next";
import { ListingStatus } from "@prisma/client";
import { headers } from "next/headers";
import { notFound, permanentRedirect } from "next/navigation";
import { getCachedBnhubListingById } from "@/lib/bnhub/cached-listing";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { buildBnhubStaySeoSlug, stayPathLookupKeys } from "@/lib/seo/public-urls";
import { BnhubListingView, bnhubGalleryUrls } from "@/app/[locale]/[country]/bnhub/bnhub-listing-view";
import { getGuestId } from "@/lib/auth/session";
import { trackEvent } from "@/src/services/analytics";
import { onMessagingTriggerListingView } from "@/src/modules/messaging/triggers";
import { CityIntentLanding } from "@/components/growth/CityIntentLanding";
import { defaultCityIntentPath } from "@/lib/growth/city-intent-seo";
import { growthCityDisplayName, growthCityRegion } from "@/lib/growth/geo-slugs";
import { parseGrowthCitySlugParam } from "@/lib/growth/geo-slugs";
import { mergeTrafficAttributionIntoMetadata } from "@/lib/attribution/social-traffic";
import { hasAdUtmParams } from "@/lib/marketing/bnhub-ad-landing-url";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string; country: string }>;
}): Promise<Metadata> {
  const { slug, locale, country } = await params;
  const citySlug = parseGrowthCitySlugParam(slug);
  if (citySlug) {
    const city = growthCityDisplayName(citySlug);
    const region = growthCityRegion(citySlug) === "US" ? "USA" : "Canada";
    const path = defaultCityIntentPath("stays", citySlug);
    return buildPageMetadata({
      title: `BNHUB stays in ${city} (${region}) | Short-term rentals | LECIPM`,
      description: `Discover short-term stays and nightly rentals in ${city}. Filter by dates and guests on BNHUB — book with clear pricing on LECIPM.`,
      path,
      locale,
      country,
      keywords: [`${city} vacation rental`, `short term stay ${city}`, "BNHUB", "LECIPM"],
    });
  }
  let listing = null as Awaited<ReturnType<typeof getCachedBnhubListingById>>;
  for (const key of stayPathLookupKeys(slug)) {
    listing = await getCachedBnhubListingById(key);
    if (listing) break;
  }
  if (!listing) return { title: "Stay" };

  if (listing.listingStatus !== ListingStatus.PUBLISHED) {
    return {
      title: listing.title,
      robots: { index: false, follow: false },
    };
  }

  const path = `/stays/${buildBnhubStaySeoSlug(listing)}`;
  const plainDesc = (listing.description ?? "").replace(/\s+/g, " ").trim();
  const amenities = Array.isArray(listing.amenities) ? (listing.amenities as string[]) : [];
  const amenityHint = amenities.slice(0, 4).join(", ");
  const desc =
    `${plainDesc.slice(0, 120)}${amenityHint ? ` · ${amenityHint}` : ""}`.slice(0, 160) ||
    `Book ${listing.title} in ${listing.city}. From $${(listing.nightPriceCents / 100).toFixed(0)} / night.`;
  const imgs = bnhubGalleryUrls(listing);

  return buildPageMetadata({
    title: `${listing.title} · ${listing.city} | BNHUB Stays`,
    description: desc,
    path,
    locale,
    country,
    ogImage: imgs[0] ?? null,
    keywords: [
      listing.city,
      listing.propertyType,
      listing.roomType,
      "vacation rental",
      listing.listingCode,
    ].filter(Boolean) as string[],
  });
}

export default async function StaySeoPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; locale: string; country: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug, locale, country } = await params;
  const sp = (await searchParams) ?? {};
  const checkIn = typeof sp.checkIn === "string" ? sp.checkIn : undefined;
  const checkOut = typeof sp.checkOut === "string" ? sp.checkOut : undefined;
  const guests = typeof sp.guests === "string" ? sp.guests : undefined;
  const prefill =
    checkIn != null || checkOut != null || guests != null ? { checkIn, checkOut, guests } : undefined;
  const citySlug = parseGrowthCitySlugParam(slug);
  if (citySlug) {
    return <CityIntentLanding intent="stays" cityParam={slug} />;
  }
  let listing = null as Awaited<ReturnType<typeof getCachedBnhubListingById>>;
  for (const key of stayPathLookupKeys(slug)) {
    listing = await getCachedBnhubListingById(key);
    if (listing) break;
  }
  if (!listing) notFound();
  if (listing.listingStatus !== ListingStatus.PUBLISHED) notFound();

  const canonicalSlug = buildBnhubStaySeoSlug(listing);
  if (slug !== canonicalSlug) {
    permanentRedirect(`/${locale}/${country}/stays/${encodeURIComponent(canonicalSlug)}`);
  }

  const guestId = await getGuestId().catch(() => null);
  const cookieHeader = (await headers()).get("cookie");
  void trackEvent(
    "listing_view",
    mergeTrafficAttributionIntoMetadata(cookieHeader, {
      listingId: listing.id,
      listingCode: listing.listingCode,
      city: listing.city,
    }),
    { userId: guestId }
  ).catch(() => {});
  if (guestId) {
    void onMessagingTriggerListingView(guestId, listing.city ?? undefined).catch(() => {});
  }

  const seoPath = `/stays/${canonicalSlug}`;
  return (
    <BnhubListingView
      routeLookupKey={listing.id}
      seoCanonicalPath={seoPath}
      prefill={prefill}
      adLanding={hasAdUtmParams(sp)}
    />
  );
}
