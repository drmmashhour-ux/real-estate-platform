import type { Metadata } from "next";
import { ListingsCollectionGrid } from "@/components/listings/ListingsCollectionGrid";
import { getFsboAffordableListings } from "@/lib/listings/fsbo-collection-queries";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { seoConfig } from "@/lib/seo/config";
import { getSiteBaseUrl } from "@/modules/seo/lib/siteBaseUrl";

export const revalidate = 180;

const PATH = "/listings/affordable";

export async function generateMetadata(): Promise<Metadata> {
  const base = getSiteBaseUrl();
  return buildPageMetadata({
    title: `Affordable listings | ${seoConfig.siteName}`,
    description: `Browse lower list-price homes and FSBO deals on ${seoConfig.siteName}. Compare options and contact representatives securely.`,
    path: PATH,
    ogImage: `${base}/brand/lecipm-mark-on-dark.svg`,
  });
}

export default async function AffordableListingsPage() {
  const items = await getFsboAffordableListings(24);
  return (
    <ListingsCollectionGrid
      title="Affordable listings"
      subtitle="Sorted by ascending list price among active public listings — always confirm details with the listing representative."
      items={items}
      canonicalPath={PATH}
    />
  );
}
