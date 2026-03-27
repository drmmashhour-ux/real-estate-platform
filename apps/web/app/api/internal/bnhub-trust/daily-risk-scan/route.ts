import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { recomputeListingTrust } from "@/modules/bnhub-trust/services/listingRiskService";
import { ListingStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const secret = process.env.BNHUB_TRUST_CRON_SECRET?.trim();
  const h = req.headers.get("x-bnhub-trust-cron")?.trim();
  if (!secret || h !== secret) return Response.json({ error: "Unauthorized" }, { status: 401 });
  let limit = 40;
  try {
    const b = await req.json();
    if (typeof b.limit === "number" && b.limit > 0 && b.limit < 200) limit = b.limit;
  } catch {
    /* empty */
  }
  const listings = await prisma.shortTermListing.findMany({
    where: {
      listingStatus: { in: [ListingStatus.PUBLISHED, ListingStatus.APPROVED, ListingStatus.PENDING_REVIEW] },
    },
    select: { id: true },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
  for (const l of listings) {
    await recomputeListingTrust(l.id).catch(() => {});
  }
  return Response.json({ ok: true, processed: listings.length });
}
