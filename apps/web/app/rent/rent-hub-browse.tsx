"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ListingsBrowseClient } from "@/components/listings/ListingsBrowseClient";
import { ListingsGridSkeleton } from "@/components/ui/SkeletonBlock";

function RentDealTypeSync() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams.get("dealType")?.toUpperCase() === "RENT") return;
    const p = new URLSearchParams(searchParams.toString());
    p.set("dealType", "RENT");
    router.replace(`${pathname}?${p.toString()}`);
  }, [pathname, router, searchParams]);
  return null;
}

export function RentHubBrowse() {
  return (
    <Suspense
      fallback={
        <div className="py-16 text-center text-sm text-slate-500">
          <ListingsGridSkeleton count={6} />
        </div>
      }
    >
      <RentDealTypeSync />
      <ListingsBrowseClient embedded hubMode="rent" />
    </Suspense>
  );
}
