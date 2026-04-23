import { ListingStatus } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { evaluateListingForAutopilot } from "@/lib/ai/autopilot/evaluateListingForAutopilot";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { listingId?: string };
  const listingId = typeof body.listingId === "string" ? body.listingId.trim() : "";

  if (listingId) {
    const listing = await prisma.shortTermListing.findUnique({
      where: { id: listingId },
      select: { ownerId: true, listingStatus: true },
    });
    if (!listing || listing.ownerId !== userId) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    if (listing.listingStatus !== ListingStatus.PUBLISHED) {
      return Response.json({ error: "Listing must be published" }, { status: 400 });
    }
    const res = await evaluateListingForAutopilot(listingId);
    return Response.json({ results: [res] });
  }

  const published = await prisma.shortTermListing.findMany({
    where: { ownerId: userId, listingStatus: ListingStatus.PUBLISHED },
    select: { id: true },
  });
  const results = [];
  for (const p of published) {
    results.push(await evaluateListingForAutopilot(p.id));
  }
  return Response.json({ results });
}
