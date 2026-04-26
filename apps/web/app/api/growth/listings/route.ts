import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { topOpportunityListings } from "@/modules/listing-growth";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  if (auth.role === PlatformRole.SELLER_DIRECT || auth.role === PlatformRole.USER || auth.role === PlatformRole.CLIENT) {
    const listings = await prisma.fsboListing.findMany({
      where: { ownerId: auth.userId },
      orderBy: { updatedAt: "desc" },
      take: 40,
      select: { id: true, title: true, city: true, status: true, updatedAt: true },
    });
    const opps = await topOpportunityListings(auth.userId, 5).catch(() => []);
    return NextResponse.json({ listings, opportunities: opps });
  }

  return NextResponse.json({
    listings: [],
    note: "Listing growth tools are oriented to seller-owned FSBO inventory for this view.",
  });
}
