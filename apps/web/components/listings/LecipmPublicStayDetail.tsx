import { BnhubListingView } from "@/app/bnhub/bnhub-listing-view";

/**
 * BNHub stay on the unified `/listings/[id]` route — same UX as `/bnhub/listings/[id]` with LECIPM canonical path.
 */
export async function LecipmPublicStayDetail({ lookupKey }: { lookupKey: string }) {
  const path = `/listings/${encodeURIComponent(lookupKey)}`;
  return <BnhubListingView routeLookupKey={lookupKey} seoCanonicalPath={path} />;
}
