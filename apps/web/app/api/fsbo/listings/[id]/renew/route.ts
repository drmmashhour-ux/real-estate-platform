import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { renewOwnerDirectFsboListing, syncFsboListingExpiryState } from "@/lib/fsbo/listing-expiry";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id } = await context.params;
  const listing = await prisma.fsboListing.findUnique({
    where: { id },
    select: { id: true, ownerId: true, listingOwnerType: true },
  });

  if (!listing) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const admin = await isPlatformAdmin(userId);
  if (!admin && listing.ownerId !== userId) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  await syncFsboListingExpiryState(id, { sendReminder: false }).catch(() => null);

  try {
    const expiry = await renewOwnerDirectFsboListing(id);
    return Response.json({
      ok: true,
      expiry: {
        expiresAt: expiry.expiresAt?.toISOString() ?? null,
        expired: expiry.expired,
        archived: expiry.archived,
        source: expiry.source,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "renewal_failed";
    if (message === "broker_contract_controls_expiry") {
      return Response.json(
        {
          error:
            "Broker-managed listings must be renewed through the signed broker mandate or updated contract term.",
        },
        { status: 409 }
      );
    }

    if (message === "listing_not_renewable") {
      return Response.json({ error: "This listing cannot be renewed." }, { status: 409 });
    }

    return Response.json({ error: "Unable to renew listing" }, { status: 500 });
  }
}
