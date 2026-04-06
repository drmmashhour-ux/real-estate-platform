import type { Metadata } from "next";
import { ListingsCollectionGrid } from "@/components/listings/ListingsCollectionGrid";
import { getFsboLuxuryListings } from "@/lib/listings/fsbo-collection-queries";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { seoConfig } from "@/lib/seo/config";
import { getSiteBaseUrl } from "@/modules/seo/lib/siteBaseUrl";

export const revalidate = 180;

const PATH = "/listings/luxury";

export async function generateMetadata(): Promise<Metadata> {
  const base = getSiteBaseUrl();
  return buildPageMetadata({
    title: `Luxury listings | ${seoConfig.siteName}`,
    description: `Premium and high list-price properties on ${seoConfig.siteName}. Explore details and connect for private showings.`,
    path: PATH,
    ogImage: `${base}/brand/lecipm-mark-on-dark.svg`,
  });
}

export default async function LuxuryListingsPage() {
  const items = await getFsboLuxuryListings(24);
  return (
    <ListingsCollectionGrid
      title="Luxury listings"
      subtitle="Highest list prices among active public inventory — not a valuation; verify condition and comparables with a professional."
      items={items}
      canonicalPath={PATH}
    />
  );
}
