import { PlatformRole } from "@prisma/client";

import { prisma } from "@/lib/db";

/** Deal file access: parties or platform admin. */
export async function findDealForUser(
  dealId: string,
  userId: string,
  role: PlatformRole,
) {
  if (role === PlatformRole.ADMIN) {
    return prisma.deal.findUnique({ where: { id: dealId } });
  }
  return prisma.deal.findFirst({
    where: {
      id: dealId,
      OR: [{ buyerId: userId }, { sellerId: userId }, { brokerId: userId }],
    },
  });
}
