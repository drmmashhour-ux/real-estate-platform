import type { Metadata } from "next";
import { Suspense } from "react";
import { AdvancedSearchClient } from "./advanced-search-client";
import { ListingsGridSkeleton } from "@/components/ui/SkeletonBlock";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { seoConfig } from "@/lib/seo/config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}): Promise<Metadata> {
  const { locale, country } = await params;
  return buildPageMetadata({
    title: `Advanced search | ${seoConfig.siteName}`,
    description: `Search properties with full filters — location, price, beds, type, and more on ${seoConfig.siteName}.`,
    path: "/search",
    locale,
    country,
  });
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#050505] px-4 py-10 text-white sm:px-6">
          <div className="mx-auto max-w-7xl space-y-4">
            <div className="h-8 w-48 animate-pulse rounded-lg bg-white/10" />
            <div className="h-4 w-72 animate-pulse rounded bg-white/5" />
          </div>
          <div className="mx-auto mt-10 max-w-7xl">
            <ListingsGridSkeleton count={6} />
          </div>
        </div>
      }
    >
      <AdvancedSearchClient />
    </Suspense>
  );
}
