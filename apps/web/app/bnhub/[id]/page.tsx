import type { Metadata } from "next";
import { ListingStatus } from "@prisma/client";
import { getCachedBnhubListingById } from "@/lib/bnhub/cached-listing";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { buildBnhubStaySeoSlug } from "@/lib/seo/public-urls";
import { BnhubListingView, bnhubGalleryUrls } from "../bnhub-listing-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const listing = await getCachedBnhubListingById(id);
  if (!listing) return { title: "Stay" };

  if (listing.listingStatus !== ListingStatus.PUBLISHED) {
    return {
      title: listing.title,
      robots: { index: false, follow: false },
    };
  }

  const canonicalPath = `/stays/${buildBnhubStaySeoSlug(listing)}`;
  const plainDesc = (listing.description ?? "").replace(/\s+/g, " ").trim();
  const desc =
    plainDesc.slice(0, 160) ||
    `Book ${listing.title} in ${listing.city}. From $${(listing.nightPriceCents / 100).toFixed(0)} / night.`;
  const imgs = bnhubGalleryUrls(listing);

  return buildPageMetadata({
    title: `${listing.title} · ${listing.city} | BNHub`,
    description: desc,
    path: canonicalPath,
    ogImage: imgs[0] ?? null,
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

export default async function BNHubListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BnhubListingView routeLookupKey={id} />;
}
