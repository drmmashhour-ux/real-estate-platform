import type { PrismaClient } from "@prisma/client";

/**
 * Simple density heuristic — many concurrent listings same owner + city.
 */
export async function computeOwnerListingCluster(
  db: PrismaClient,
  args: { ownerId: string; city: string; excludeListingId: string }
): Promise<{ clusterRisk: number; summary?: string }> {
  const n = await db.fsboListing.count({
    where: {
      ownerId: args.ownerId,
      city: args.city,
      id: { not: args.excludeListingId },
      status: { in: ["ACTIVE", "DRAFT", "PENDING_VERIFICATION"] },
    },
  });
  if (n >= 8) {
    return {
      clusterRisk: 72,
      summary: `Owner has ${n} other listings in the same city — review for policy compliance.`,
    };
  }
  if (n >= 4) {
    return { clusterRisk: 38, summary: `Owner has ${n} other listings in this city.` };
  }
  return { clusterRisk: 14 };
}
