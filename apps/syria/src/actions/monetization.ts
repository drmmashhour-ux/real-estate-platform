"use server";

import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { assertDarlinkRuntimeEnv } from "@/lib/guard";
import { trackEvent } from "@/lib/track-event";

export type RequestListingFeaturedState = { ok: true } | { ok: false; reason: "auth" | "forbidden" | "not_free" | "not_found" };

/**
 * Fires `listing_featured_requested` and shows contact instructions (no payment, no plan change here).
 * Admin sets `plan = featured` manually after payment.
 */
export async function requestListingFeaturedAction(listingId: string): Promise<RequestListingFeaturedState> {
  assertDarlinkRuntimeEnv();
  const user = await getSessionUser();
  if (!user) return { ok: false, reason: "auth" };

  const listing = await prisma.syriaProperty.findFirst({
    where: { id: listingId, ownerId: user.id },
  });
  if (!listing) return { ok: false, reason: "not_found" };
  if (listing.plan !== "free") return { ok: false, reason: "not_free" };

  await trackEvent("listing_featured_requested", { listingId, userId: user.id });
  await trackEvent("feature_clicked", { listingId, userId: user.id });
  return { ok: true };
}
