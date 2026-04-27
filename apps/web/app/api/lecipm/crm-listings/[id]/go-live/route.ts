import { requireAuth } from "@/lib/auth/middleware";
import { setListingLive } from "@/lib/compliance/goLive";
import { monolithPrisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Set `crmMarketplaceLive` on a CRM `Listing` only via OACIQ DS gate with audit.
 * @param id — monolith `Listing.id`
 */
export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = requireAuth(req);
  if (!user || !("userId" in user)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (user as { userId: string }).userId;
  const { id: rawId } = await context.params;
  if (!rawId?.trim()) {
    return Response.json({ error: "id required" }, { status: 400 });
  }
  const listingId = rawId.trim();

  const listing = await monolithPrisma.listing.findUnique({
    where: { id: listingId },
  });
  if (!listing) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  if (listing.userId !== userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await setListingLive(listing.id, userId);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Go-live failed";
    return Response.json({ error: message }, { status: 400 });
  }

  return Response.json({ ok: true, listingId, crmMarketplaceLive: true });
}
