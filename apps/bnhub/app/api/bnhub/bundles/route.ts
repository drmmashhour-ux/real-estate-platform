import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import {
  getEligibleBundlesForListingOrReservation,
  listPublicBundlesCatalog,
} from "@/src/modules/bnhub-hospitality/services/bundleService";

export const dynamic = "force-dynamic";

/**
 * Without `listingId`: only PUBLIC bundles (safe catalog).
 * With `listingId`: eligibility rules (membership, host/admin-selected hidden until wired).
 */
export async function GET(request: NextRequest) {
  const listingId = request.nextUrl.searchParams.get("listingId");
  const userId = await getGuestId();
  if (listingId) {
    const bundles = await getEligibleBundlesForListingOrReservation({ listingId, userId });
    return Response.json({ bundles });
  }
  const bundles = await listPublicBundlesCatalog();
  return Response.json({ bundles });
}
