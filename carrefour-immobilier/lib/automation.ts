import { prisma } from "@/lib/prisma";

/** Marks an offer as accepted (deal closed from the offer side). */
export async function closeDeal(offerId: string) {
  return prisma.offer.update({
    where: { id: offerId },
    data: { status: "ACCEPTED" },
  });
}
