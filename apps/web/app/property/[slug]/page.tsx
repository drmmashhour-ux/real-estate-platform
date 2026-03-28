import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { resolveShortTermListingRef, normalizeAnyPublicListingCode } from "@/lib/listing-code";
import { getCachedBnhubListingById } from "@/lib/bnhub/cached-listing";
import { buildBnhubStaySeoSlug } from "@/lib/seo/public-urls";
import { buildPageMetadata } from "@/lib/seo/page-metadata";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const resolved = await resolveShortTermListingRef(slug);
  if (!resolved) return { title: "Property" };
  const listing = await getCachedBnhubListingById(resolved.id);
  if (!listing) return { title: "Property" };
  const path = `/stays/${buildBnhubStaySeoSlug(listing)}`;
  return buildPageMetadata({
    title: `${listing.title} · ${listing.city}`,
    description: (listing.description ?? "").replace(/\s+/g, " ").trim().slice(0, 160),
    path,
  });
}

/** Resolves BNHub LEC/LST or UUID, or FSBO id/code → canonical public URL. */
export default async function PropertySlugPage({ params }: Props) {
  const { slug } = await params;
  const resolved = await resolveShortTermListingRef(slug);
  if (resolved) {
    const listing = await getCachedBnhubListingById(resolved.id);
    if (!listing) notFound();
    permanentRedirect(`/stays/${buildBnhubStaySeoSlug(listing)}`);
  }

  const code = normalizeAnyPublicListingCode(slug);
  const fsbo = await prisma.fsboListing.findFirst({
    where: {
      OR: [{ id: slug }, ...(code ? [{ listingCode: { equals: code, mode: "insensitive" as const } }] : [])],
    },
    select: { id: true },
  });
  if (fsbo) permanentRedirect(`/sell/${fsbo.id}`);
  notFound();
}
