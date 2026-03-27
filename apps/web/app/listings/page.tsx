import type { Metadata } from "next";
import { Suspense } from "react";
import { ListingsBrowseClient } from "@/components/listings/ListingsBrowseClient";
import { ListingsGridSkeleton } from "@/components/ui/SkeletonBlock";
import { PLATFORM_NAME } from "@/config/branding";

export const metadata: Metadata = {
  title: "Listings",
  description: `Browse properties for sale on ${PLATFORM_NAME}. Filter by city, price, beds, and type — no login required.`,
};

export default function ListingsIndexPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0B0B0B] px-4 py-10 sm:px-6">
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
