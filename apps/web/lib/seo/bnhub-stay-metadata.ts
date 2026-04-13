import type { Metadata } from "next";
import { ListingStatus } from "@prisma/client";
import { DEFAULT_COUNTRY_SLUG } from "@/config/countries";
import { getCachedBnhubListingById } from "@/lib/bnhub/cached-listing";
import { routing } from "@/i18n/routing";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { OG_DEFAULT_BNHUB } from "@/lib/seo/og-defaults";
function primaryStayPhotoUrl(
  listing: NonNullable<Awaited<ReturnType<typeof getCachedBnhubListingById>>>
): string | null {
  const first = listing.listingPhotos?.[0]?.url;
  if (first) return first;
  const photos = listing.photos;
  if (Array.isArray(photos)) {
    const s = photos.find((x): x is string => typeof x === "string");
    if (s) return s;
  }
  return null;
}

/**
 * Open Graph + Twitter for BNHUB stay detail routes.
 * Canonical share URL is always `/listings/{id}` (same as unified listing route).
 */
export async function generateMetadataForBnhubStayRoute(
  routeLookupKey: string,
  locale: string = routing.defaultLocale,
  country: string = DEFAULT_COUNTRY_SLUG
): Promise<Metadata> {
  const listing = await getCachedBnhubListingById(routeLookupKey);
  if (!listing) return { title: "Stay" };

  if (listing.listingStatus !== ListingStatus.PUBLISHED) {
    return {
      title: listing.title,
      robots: { index: false, follow: false },
    };
  }

  const nightlyNum = listing.nightPriceCents / 100;
  const nightlyLabel = nightlyNum.toLocaleString("en-CA", {
    minimumFractionDigits: nightlyNum % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  const plainDesc = (listing.description ?? "").replace(/\s+/g, " ").trim();
  const desc =
    plainDesc.slice(0, 140) ||
    `${listing.title} in ${listing.city} — from $${nightlyLabel} CAD/night on BNHUB.`;
  const primary = primaryStayPhotoUrl(listing);
  const path = `/listings/${listing.id}`;

  return buildPageMetadata({
    title: `${listing.title} · $${nightlyLabel}/night · ${listing.city} | BNHUB`,
    description: desc,
    path,
    locale,
    country,
    ogImage: primary,
    ogImageFallback: OG_DEFAULT_BNHUB,
    ogImageAlt: `${listing.title} — $${nightlyLabel}/night — ${listing.city}`,
    ogProduct: { amount: nightlyNum.toFixed(2), currency: "CAD" },
    keywords: [
      listing.city,
      listing.propertyType,
      listing.roomType,
      "vacation rental",
      "short-term rental",
      listing.listingCode,
    ].filter(Boolean) as string[],
  });
}
