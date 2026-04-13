import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { listPublicServicesForListing } from "@/src/modules/bnhub-hospitality/services/hospitalityServiceCatalogService";
import { getEligibleBundlesForListingOrReservation } from "@/src/modules/bnhub-hospitality/services/bundleService";

export const dynamic = "force-dynamic";

/** Guest mobile: safe listing offers + eligibility-filtered bundles. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: listingId } = await params;
  const userId = await getGuestId();
  const [offers, bundles] = await Promise.all([
    listPublicServicesForListing(listingId),
    getEligibleBundlesForListingOrReservation({ listingId, userId }),
  ]);
  return Response.json({
    offers,
    bundles,
    disclaimer:
      "Add-ons are offered by hosts or partners. BNHUB does not guarantee fulfillment of third-party services.",
  });
}
