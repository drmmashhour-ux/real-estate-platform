"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useSearchEngineContext } from "@/components/search/SearchEngine";

/**
 * Deep-link assistant / shared URLs into BNHUB stays search (`?city=&guests=&checkIn=&checkOut=&maxPrice=&minBeds=`).
 */
function BnhubStaysQuerySyncInner() {
  const sp = useSearchParams();
  const { applyPatch } = useSearchEngineContext();

  useEffect(() => {
    const city = sp.get("city")?.trim();
    const guests = sp.get("guests");
    const checkIn = sp.get("checkIn")?.trim();
    const checkOut = sp.get("checkOut")?.trim();
    const maxPrice = sp.get("maxPrice");
    const minBeds = sp.get("minBeds");
    if (!city && !guests && !checkIn && !checkOut && !maxPrice && !minBeds) return;

    const g = guests ? Math.min(20, Math.max(1, parseInt(guests, 10) || 1)) : undefined;
    const pm = maxPrice ? Math.max(0, parseInt(maxPrice, 10) || 0) : undefined;
    const mb = minBeds ? Math.max(0, parseInt(minBeds, 10) || 0) : undefined;

    applyPatch({
      ...(city ? { location: city } : {}),
      ...(g != null ? { guests: g } : {}),
      ...(checkIn ? { checkIn } : {}),
      ...(checkOut ? { checkOut } : {}),
      ...(pm != null && pm > 0 ? { priceMax: pm, priceMin: 0 } : {}),
      ...(mb != null && mb > 0 ? { bedrooms: mb } : {}),
    });
  }, [sp, applyPatch]);

  return null;
}

export function BnhubStaysQuerySync() {
  return (
    <Suspense fallback={null}>
      <BnhubStaysQuerySyncInner />
    </Suspense>
  );
}
