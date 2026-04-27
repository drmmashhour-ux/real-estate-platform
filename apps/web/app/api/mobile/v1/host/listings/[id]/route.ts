import { ListingStatus, Prisma } from "@prisma/client";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import {
  HostPublishIdentityError,
  HOST_PUBLISH_IDENTITY_ERROR_MESSAGE,
  requireHostIdentityForShortTermPublish,
} from "@/lib/compliance/identityGateForPublish";
import { requireMobileUser, resolveMobileAppRoleFromRequest } from "@/lib/mobile/mobileAuth";
import { enqueueHostAutopilot } from "@/lib/ai/autopilot/triggers";

export const dynamic = "force-dynamic";

/** PATCH quick host updates: price, list/unlist (published ↔ unlisted when allowed). */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireMobileUser(request);
    const appRole = await resolveMobileAppRoleFromRequest(request, user);
    if (appRole === "guest" && user.role !== "ADMIN") {
      return Response.json({ error: "Host access required" }, { status: 403 });
    }
    const { id } = await params;
    const listing = await prisma.shortTermListing.findFirst({
      where: { id, ownerId: user.id },
      select: { id: true, nightPriceCents: true, listingStatus: true },
    });
    if (!listing) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const data: Prisma.ShortTermListingUpdateInput = {};

    if (typeof body.nightPriceUsd === "number" && Number.isFinite(body.nightPriceUsd) && body.nightPriceUsd > 0) {
      data.nightPriceCents = Math.round(body.nightPriceUsd * 100);
    }
    if (typeof body.nightPriceCents === "number" && Number.isFinite(body.nightPriceCents) && body.nightPriceCents > 0) {
      data.nightPriceCents = Math.floor(body.nightPriceCents);
    }

    if (body.toggleListed === true) {
      if (listing.listingStatus === ListingStatus.PUBLISHED) {
        data.listingStatus = ListingStatus.UNLISTED;
      } else if (
        listing.listingStatus === ListingStatus.UNLISTED ||
        listing.listingStatus === ListingStatus.APPROVED
      ) {
        try {
          await requireHostIdentityForShortTermPublish(user.id);
        } catch (e) {
          if (e instanceof HostPublishIdentityError) {
            return Response.json({ error: HOST_PUBLISH_IDENTITY_ERROR_MESSAGE }, { status: 403 });
          }
          throw e;
        }
        data.listingStatus = ListingStatus.PUBLISHED;
      }
    }

    if (Object.keys(data).length === 0) {
      return Response.json({ error: "No valid fields (nightPriceUsd, nightPriceCents, toggleListed)" }, { status: 400 });
    }

    const updated = await prisma.shortTermListing.update({
      where: { id },
      data,
      select: {
        id: true,
        nightPriceCents: true,
        listingStatus: true,
        title: true,
      },
    });

    enqueueHostAutopilot(user.id, { type: "listing_updated", listingId: id });

    return Response.json({ listing: updated });
  } catch (e) {
    const err = e as Error & { status?: number };
    if (err.status === 401) return Response.json({ error: "Unauthorized" }, { status: 401 });
    throw e;
  }
}
