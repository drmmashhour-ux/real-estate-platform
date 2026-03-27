import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { checkListingLocationPolicy } from "@/modules/bnhub-trust/services/zonePolicyService";
import { ListingStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const secret = process.env.BNHUB_TRUST_CRON_SECRET?.trim();
  const h = req.headers.get("x-bnhub-trust-cron")?.trim();
  if (!secret || h !== secret) return Response.json({ error: "Unauthorized" }, { status: 401 });
  let limit = 60;
  try {
    const b = await req.json();
    if (typeof b.limit === "number" && b.limit > 0 && b.limit < 300) limit = b.limit;
  } catch {
    /* empty */
  }
  const listings = await prisma.shortTermListing.findMany({
    where: { listingStatus: { not: ListingStatus.PERMANENTLY_REMOVED } },
    select: { id: true },
    take: limit,
  });
  for (const l of listings) {
    await checkListingLocationPolicy(l.id).catch(() => {});
  }
  return Response.json({ ok: true, processed: listings.length });
}
