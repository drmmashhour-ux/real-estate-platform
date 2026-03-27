/**
 * Public-safe badge only — no evidence, no accusatory language.
 */

import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const listingId = (await ctx.params).id;
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: { listingStatus: true },
  });
  if (!listing) return Response.json({ error: "Not found" }, { status: 404 });
  const engine = await prisma.bnhubListingTrustRiskProfile.findUnique({
    where: { listingId },
    select: { trustStatus: true },
  });
  const safety = await prisma.bnhubListingSafetyProfile.findUnique({
    where: { listingId },
    select: { publicMessageKey: true, bookingAllowed: true },
  });
  let badge: "ok" | "review" | "unavailable" = "ok";
  if (!safety?.bookingAllowed) badge = "unavailable";
  else if (engine?.trustStatus === "REVIEW_REQUIRED" || engine?.trustStatus === "RESTRICTED") badge = "review";
  return Response.json({
    badge,
    messageKey: safety?.publicMessageKey ?? "approved",
  });
}
