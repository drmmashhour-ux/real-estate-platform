import { prisma } from "@/lib/db";

export async function loadDealForMapper(dealId: string) {
  return prisma.deal.findUnique({
    where: { id: dealId },
    include: {
      buyer: { select: { name: true, email: true, phone: true, sellerProfileAddress: true } },
      seller: { select: { name: true, email: true, phone: true, sellerProfileAddress: true } },
      broker: { select: { name: true, email: true, phone: true } },
      dealParties: true,
    },
  });
}
