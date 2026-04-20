import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/**
 * GET /api/broker/centris-conversion — Centris-attributed leads tied to this broker’s FSBO or CRM listings.
 */
export async function GET(request: Request) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role !== "BROKER" && user?.role !== "ADMIN") {
    return Response.json({ error: "Broker access only" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const days = Math.min(90, Math.max(1, parseInt(searchParams.get("days") ?? "30", 10) || 30));
  const since = new Date(Date.now() - days * 86400000);

  const ownedCrmIds = await prisma.listing.findMany({
    where: { ownerId: userId },
    select: { id: true },
  });
  const crmIds = ownedCrmIds.map((r) => r.id);

  const orClauses: Prisma.LeadWhereInput[] = [{ fsboListing: { ownerId: userId } }];
  if (crmIds.length > 0) {
    orClauses.push({ listingId: { in: crmIds } });
  }

  const where: Prisma.LeadWhereInput = {
    distributionChannel: "CENTRIS",
    createdAt: { gte: since },
    OR: orClauses,
  };

  const [centrisLeads, convertedToPlatformUsers, revenueAgg] = await Promise.all([
    prisma.lead.count({ where }),
    prisma.lead.count({ where: { ...where, userId: { not: null } } }),
    prisma.lead.aggregate({
      where: {
        ...where,
        finalCommission: { not: null },
      },
      _sum: { finalCommission: true },
    }),
  ]);

  return Response.json({
    days,
    since: since.toISOString(),
    centrisLeads,
    convertedToPlatformUsers,
    /** Stored as dollars CAD in `finalCommission` when deals close — sum for scoped leads. */
    revenueCad: revenueAgg._sum.finalCommission ?? 0,
    note: "Counts include leads with distribution CENTRIS on your FSBO listings or CRM listings. Revenue sums recorded final commission on closed deals.",
  });
}
