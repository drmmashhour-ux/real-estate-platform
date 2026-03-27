import { validateAndPersistGeospatialForListing } from "@/lib/trustgraph/infrastructure/services/geospatialConsistencyService";
import { isTrustGraphGeospatialValidationEnabled, isTrustGraphEnabled } from "@/lib/trustgraph/feature-flags";

export async function syncGeospatialValidationForListing(listingId: string) {
  if (!isTrustGraphEnabled() || !isTrustGraphGeospatialValidationEnabled()) {
    return { skipped: true as const };
  }
  const r = await validateAndPersistGeospatialForListing(listingId);
  return { skipped: false as const, result: r };
}
