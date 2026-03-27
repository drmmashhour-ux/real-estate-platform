/**
 * Broker collaboration: shared listings, lead tracking, and broker-to-broker messaging.
 */
import { prisma } from "@/lib/db";

/** List listing IDs the broker can access (owner or via BrokerListingAccess). */
export async function getListingIdsForBroker(brokerId: string): Promise<string[]> {
  const owned = await prisma.listing.findMany({
    where: { ownerId: brokerId },
    select: { id: true },
  });
  const shared = await prisma.brokerListingAccess.findMany({
    where: { brokerId },
    select: { listingId: true },
  });
  const set = new Set([...owned.map((l) => l.id), ...shared.map((a) => a.listingId)]);
  return Array.from(set);
}

/** Listings with access info for a broker. */
export async function getListingsForBroker(brokerId: string) {
  const listingIds = await getListingIdsForBroker(brokerId);
  if (listingIds.length === 0) return [];
  const listings = await prisma.listing.findMany({
    where: { id: { in: listingIds } },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      brokerAccesses: {
        include: { broker: { select: { id: true, name: true, email: true } } },
      },
    },
  });
  return listings;
}

/** Grant a broker access to a listing. Caller must be owner or have collaborator+ role. */
export async function grantListingAccess(params: {
  listingId: string;
  brokerId: string;
  role: "viewer" | "collaborator" | "owner";
  grantedById: string;
}): Promise<boolean> {
  const listing = await prisma.listing.findUnique({
    where: { id: params.listingId },
    include: { brokerAccesses: true },
  });
  if (!listing) return false;
  const canGrant = listing.ownerId === params.grantedById
    || listing.brokerAccesses.some(
        (a) => a.brokerId === params.grantedById && (a.role === "owner" || a.role === "collaborator")
      );
  if (!canGrant) return false;
  await prisma.brokerListingAccess.upsert({
    where: {
      listingId_brokerId: { listingId: params.listingId, brokerId: params.brokerId },
    },
    create: {
      listingId: params.listingId,
      brokerId: params.brokerId,
      role: params.role,
      grantedById: params.grantedById,
    },
    update: { role: params.role, grantedById: params.grantedById },
  });
  return true;
}

/** Revoke a broker's access. Caller must be owner or collaborator+. */
export async function revokeListingAccess(
  listingId: string,
  brokerId: string,
  revokedById: string
): Promise<boolean> {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: { brokerAccesses: true },
  });
  if (!listing) return false;
  const canRevoke = listing.ownerId === revokedById
    || listing.brokerAccesses.some(
        (a) => a.brokerId === revokedById && (a.role === "owner" || a.role === "collaborator")
      );
  if (!canRevoke) return false;
  if (listing.ownerId === brokerId) return false;
  await prisma.brokerListingAccess.deleteMany({
    where: { listingId, brokerId },
  });
  return true;
}

/** Get or create a conversation between two brokers (canonical order broker1Id < broker2Id). */
export async function getOrCreateBrokerConversation(broker1Id: string, broker2Id: string) {
  const [id1, id2] = [broker1Id, broker2Id].sort();
  const existing = await prisma.brokerConversation.findUnique({
    where: { broker1Id_broker2Id: { broker1Id: id1, broker2Id: id2 } },
    include: {
      broker1: { select: { id: true, name: true, email: true } },
      broker2: { select: { id: true, name: true, email: true } },
    },
  });
  if (existing) return existing;
  return prisma.brokerConversation.create({
    data: { broker1Id: id1, broker2Id: id2 },
    include: {
      broker1: { select: { id: true, name: true, email: true } },
      broker2: { select: { id: true, name: true, email: true } },
    },
  });
}

/** List conversations for a broker. */
export async function getBrokerConversations(brokerId: string) {
  return prisma.brokerConversation.findMany({
    where: { OR: [{ broker1Id: brokerId }, { broker2Id: brokerId }] },
    include: {
      broker1: { select: { id: true, name: true, email: true } },
      broker2: { select: { id: true, name: true, email: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });
}
