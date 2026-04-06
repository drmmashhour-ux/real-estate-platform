import type { Metadata } from "next";
import { ListingsCollectionGrid } from "@/components/listings/ListingsCollectionGrid";
import { getFsboTopListings } from "@/lib/listings/fsbo-collection-queries";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { seoConfig } from "@/lib/seo/config";
import { getSiteBaseUrl } from "@/modules/seo/lib/siteBaseUrl";

export const revalidate = 180;

const PATH = "/listings/top";

export async function generateMetadata(): Promise<Metadata> {
  const base = getSiteBaseUrl();
  return buildPageMetadata({
    title: `Top listings | ${seoConfig.siteName}`,
    description: `Featured and recently updated homes for sale on ${seoConfig.siteName} — browse top picks with photos and list prices.`,
    path: PATH,
    ogImage: `${base}/brand/lecipm-mark-on-dark.svg`,
  });
}

export default async function TopListingsPage() {
  const items = await getFsboTopListings(24);
  return (
    <ListingsCollectionGrid
      title="Top listings"
      subtitle="Featured placements and fresh updates from active seller and broker listings."
      items={items}
      canonicalPath={PATH}
    />
  );
}
