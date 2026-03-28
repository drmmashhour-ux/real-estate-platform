import type { Metadata } from "next";
import { Suspense } from "react";
import { ListingsBrowseClient } from "@/components/listings/ListingsBrowseClient";
import { ListingsGridSkeleton } from "@/components/ui/SkeletonBlock";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { seoConfig } from "@/lib/seo/config";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: `Property listings | ${seoConfig.siteName}`,
    description: `Browse properties for sale on ${seoConfig.siteName}. Filter by city, price, beds, and type — no login required.`,
    path: "/listings",
  });
}

export default function ListingsIndexPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-brand-background px-4 py-10 sm:px-6">
          <div className="mx-auto max-w-6xl space-y-4">
            <div className="h-3 w-28 animate-pulse rounded bg-slate-700" />
            <div className="h-10 max-w-sm animate-pulse rounded-lg bg-slate-800" />
          </div>
          <div className="mx-auto mt-10 max-w-6xl">
            <ListingsGridSkeleton count={6} />
          </div>
        </div>
      }
    >
      <ListingsBrowseClient />
    </Suspense>
  );
}
