import { monolithPrisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/middleware";
import { validateListing } from "@/lib/compliance/checks";

export const dynamic = "force-dynamic";

/**
 * Set `crmMarketplaceLive` on a CRM `Listing` after OACIQ seller declaration checks.
 * @param id — monolith `Listing.id`
 */
export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = requireAuth(_req);
  if (!user || !("userId" in user)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: listingId } = await context.params;
  if (!listingId?.trim()) {
    return Response.json({ error: "id required" }, { status: 400 });
  }

  const listing = await monolithPrisma.listing.findUnique({
    where: { id: listingId.trim() },
  });
  if (!listing) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  if (listing.userId !== (user as { userId: string }).userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await validateListing(listing.id);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Compliance check failed";
    return Response.json({ error: message }, { status: 400 });
  }

  const updated = await monolithPrisma.listing.update({
    where: { id: listing.id },
    data: { crmMarketplaceLive: true },
  });

  return Response.json({ ok: true, listingId: updated.id, crmMarketplaceLive: true });
}
