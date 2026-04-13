"use client";

import { useSearchParams } from "next/navigation";
import { ContentPerformanceViewBeacon } from "@/components/content-machine/ContentPerformanceViewBeacon";

/**
 * When the stay URL includes `?cc=<MachineGeneratedContent.id>`, record a view and bind attribution for later conversion.
 */
export function BnhubListingContentAttribution({ listingId }: { listingId: string }) {
  const sp = useSearchParams();
  const cc = sp?.get("cc")?.trim();
  if (!cc) return null;
  return <ContentPerformanceViewBeacon contentId={cc} listingId={listingId} />;
}
