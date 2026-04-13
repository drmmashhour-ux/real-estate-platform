import type { Metadata } from "next";
import { Suspense } from "react";
import { LecipmListingsExplorer } from "@/components/listings/LecipmListingsExplorer";
import { ListingsGridSkeleton } from "@/components/ui/SkeletonBlock";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { seoConfig } from "@/lib/seo/config";
import { OG_DEFAULT_LISTINGS } from "@/lib/seo/og-defaults";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}): Promise<Metadata> {
  const { locale, country } = await params;
  return buildPageMetadata({
    title: `Property listings | ${seoConfig.siteName}`,
    description: `Browse properties on ${seoConfig.siteName}. Search by city or listing ID, filter by price and layout, and explore results on the map.`,
    path: "/listings",
    locale,
    country,
    ogImage: OG_DEFAULT_LISTINGS,
    ogImageAlt: `Browse property listings on ${seoConfig.siteName}`,
  });
}

export default function ListingsIndexPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black px-4 py-10 text-white sm:px-6">
          <div className="mx-auto max-w-6xl space-y-4">
            <div className="h-12 max-w-full animate-pulse rounded-2xl bg-white/10" />
            <ListingsGridSkeleton count={6} />
          </div>
        </div>
      }
    >
      <LecipmListingsExplorer />
    </Suspense>
  );
}
