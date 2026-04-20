import { prisma } from "@/lib/db";
import { getListingIdsForBroker } from "@/lib/broker/collaboration";

/** Whether the user may read/update CRM listing compliance for this listing (owner, collaborator, or admin). */
export async function canAccessCrmListingCompliance(userId: string, listingId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role === "ADMIN") return true;

  const ids = await getListingIdsForBroker(userId);
  return ids.includes(listingId);
}
