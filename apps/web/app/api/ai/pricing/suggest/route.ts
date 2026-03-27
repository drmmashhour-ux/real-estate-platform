import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { suggestNightlyPriceForListing } from "@/lib/ai/pricing-assistant";

export const dynamic = "force-dynamic";

/** GET /api/ai/pricing/suggest?listingId= — broker/admin or listing owner. */
export async function GET(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

  const listingId = new URL(request.url).searchParams.get("listingId") ?? "";
  if (!listingId) return Response.json({ error: "listingId required" }, { status: 400 });

  const [user, listing] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { role: true } }),
    prisma.shortTermListing.findUnique({
      where: { id: listingId },
      select: { ownerId: true },
    }),
  ]);

  if (!listing) return Response.json({ error: "Not found" }, { status: 404 });

  const allowed =
    user?.role === "ADMIN" ||
    user?.role === "BROKER" ||
    listing.ownerId === userId;

  if (!allowed) return Response.json({ error: "Forbidden" }, { status: 403 });

  const suggestion = await suggestNightlyPriceForListing(listingId);
  if (!suggestion) return Response.json({ error: "Unable to compute" }, { status: 500 });

  return Response.json({ ...suggestion, disclaimer: "Heuristic only — not an appraisal." });
}
