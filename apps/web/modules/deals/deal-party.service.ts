import { prisma } from "@/lib/db";

export async function listDealParties(dealId: string) {
  return prisma.dealParty.findMany({ where: { dealId }, orderBy: { createdAt: "asc" } });
}
