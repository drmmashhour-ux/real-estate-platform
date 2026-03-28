import type { Metadata } from "next";
import { ListingStatus } from "@prisma/client";
import { notFound, permanentRedirect } from "next/navigation";
import { getCachedBnhubListingById } from "@/lib/bnhub/cached-listing";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { buildBnhubStaySeoSlug, stayPathLookupKeys } from "@/lib/seo/public-urls";
import { BnhubListingView, bnhubGalleryUrls } from "@/app/bnhub/bnhub-listing-view";
import { getGuestId } from "@/lib/auth/session";
import { trackEvent } from "@/src/services/analytics";
import { onMessagingTriggerListingView } from "@/src/modules/messaging/triggers";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
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
    title: `${listing.title} · ${listing.city} | BNHub Stays`,
    description: desc,
    path,
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

export default async function StaySeoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let listing = null as Awaited<ReturnType<typeof getCachedBnhubListingById>>;
  for (const key of stayPathLookupKeys(slug)) {
    listing = await getCachedBnhubListingById(key);
    if (listing) break;
  }
  if (!listing) notFound();
  if (listing.listingStatus !== ListingStatus.PUBLISHED) notFound();

  const canonicalSlug = buildBnhubStaySeoSlug(listing);
  if (slug !== canonicalSlug) {
    permanentRedirect(`/stays/${encodeURIComponent(canonicalSlug)}`);
  }

  const guestId = await getGuestId().catch(() => null);
  void trackEvent(
    "listing_view",
    { listingId: listing.id, listingCode: listing.listingCode, city: listing.city },
    { userId: guestId }
  ).catch(() => {});
  if (guestId) {
    void onMessagingTriggerListingView(guestId, listing.city ?? undefined).catch(() => {});
  }

  const seoPath = `/stays/${canonicalSlug}`;
  return <BnhubListingView routeLookupKey={listing.id} seoCanonicalPath={seoPath} />;
}
