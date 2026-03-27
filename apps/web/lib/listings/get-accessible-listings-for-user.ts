import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export type AccessibleListingRow = {
  id: string;
  listingCode: string;
  title: string;
  price: number;
  tenantId: string | null;
  createdAt: Date;
};

/**
 * Listings visible in the broker CRM dashboard: tenant membership and/or explicit broker access.
 */
export async function getAccessibleListingsForUser(userId: string, isAdmin: boolean): Promise<AccessibleListingRow[]> {
  if (isAdmin) {
    return prisma.listing.findMany({
      take: 80,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        listingCode: true,
        title: true,
        price: true,
        tenantId: true,
        createdAt: true,
      },
    });
  }

  const memberships = await prisma.tenantMembership.findMany({
    where: { userId, status: "ACTIVE" },
    select: { tenantId: true },
  });
  const tenantIds = memberships.map((m) => m.tenantId);

  const accesses = await prisma.brokerListingAccess.findMany({
    where: { brokerId: userId },
    select: { listingId: true },
  });
  const accessListingIds = accesses.map((a) => a.listingId);

  const or: Prisma.ListingWhereInput[] = [];
  if (tenantIds.length) {
    or.push({ tenantId: { in: tenantIds } });
  }
  if (accessListingIds.length) {
    or.push({ id: { in: accessListingIds } });
  }
  if (or.length === 0) {
    return [];
  }

  return prisma.listing.findMany({
    where: { OR: or },
    take: 80,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      listingCode: true,
      title: true,
      price: true,
      tenantId: true,
      createdAt: true,
    },
  });
}
