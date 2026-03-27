import { prisma } from "@/lib/db";
import type { BrokerClient } from "@prisma/client";

/** Offers submitted by the linked platform user (buyer). */
export async function getOffersForLinkedUser(userId: string, take = 40) {
  return prisma.offer.findMany({
    where: { buyerId: userId },
    orderBy: { updatedAt: "desc" },
    take,
    select: {
      id: true,
      listingId: true,
      status: true,
      offeredPrice: true,
      updatedAt: true,
      createdAt: true,
      brokerId: true,
    },
  });
}

export async function getContractsForLinkedUser(userId: string, take = 40) {
  return prisma.contract.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take,
    select: {
      id: true,
      type: true,
      title: true,
      status: true,
      listingId: true,
      signedAt: true,
      updatedAt: true,
      createdAt: true,
      _count: { select: { signatures: true } },
    },
  });
}

/** Deals where the client participates as buyer or seller (platform account). */
export async function getDealsForLinkedUser(userId: string, take = 40) {
  return prisma.deal.findMany({
    where: {
      OR: [{ buyerId: userId }, { sellerId: userId }],
    },
    orderBy: { updatedAt: "desc" },
    take,
    select: {
      id: true,
      listingId: true,
      listingCode: true,
      status: true,
      priceCents: true,
      brokerId: true,
      updatedAt: true,
      createdAt: true,
    },
  });
}

export async function getBrokerCrmRelatedRecords(client: Pick<BrokerClient, "userId">) {
  const uid = client.userId;
  if (!uid) {
    return {
      offers: [] as Awaited<ReturnType<typeof getOffersForLinkedUser>>,
      contracts: [] as Awaited<ReturnType<typeof getContractsForLinkedUser>>,
      deals: [] as Awaited<ReturnType<typeof getDealsForLinkedUser>>,
    };
  }
  const [offers, contracts, deals] = await Promise.all([
    getOffersForLinkedUser(uid),
    getContractsForLinkedUser(uid),
    getDealsForLinkedUser(uid),
  ]);
  return { offers, contracts, deals };
}
