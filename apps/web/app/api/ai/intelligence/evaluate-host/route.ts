import { NextRequest } from "next/server";
import { ListingStatus } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { evaluateListingForAutopilot } from "@/lib/ai/autopilot/evaluateListingForAutopilot";

export const dynamic = "force-dynamic";

/** POST — evaluate all published listings for the current host. */
export async function POST(_request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const listings = await prisma.shortTermListing.findMany({
    where: { ownerId: userId, listingStatus: ListingStatus.PUBLISHED },
    select: { id: true },
  });

  let ok = 0;
  const errors: string[] = [];
  for (const l of listings) {
    try {
      await evaluateListingForAutopilot(l.id);
      ok += 1;
    } catch (e) {
      errors.push(l.id);
    }
  }

  return Response.json({ evaluated: ok, total: listings.length, errors });
}
