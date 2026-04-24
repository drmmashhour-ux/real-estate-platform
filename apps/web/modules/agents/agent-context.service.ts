import { prisma } from "@/lib/db";

export type ListingAgentContext = {
  listingId: string;
  title: string;
  price: number;
  ownerId: string | null;
  daysOnMarket: number | null;
  completenessScore: number | null;
  messageResponseRate: number | null;
  isCoOwnership: boolean;
};

export type DealAgentContext = {
  dealId: string;
  status: string;
  priceCents: number;
  listingId: string | null;
  brokerId: string | null;
  milestoneOpenCount: number;
};

export type ConversationAgentContext = {
  conversationId: string;
  listingId: string | null;
  unreadOrQueued: number;
};

export async function buildListingAgentContext(listingId: string): Promise<ListingAgentContext | null> {
  const row = await prisma.listing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      title: true,
      price: true,
      ownerId: true,
      createdAt: true,
      isCoOwnership: true,
      complianceScore: true,
    },
  });
  if (!row) return null;
  const daysOnMarket = Math.max(0, Math.floor((Date.now() - row.createdAt.getTime()) / (86400 * 1000)));
  const completenessScore = row.complianceScore != null ? Math.min(1, row.complianceScore / 100) : 0.62;
  return {
    listingId: row.id,
    title: row.title,
    price: row.price,
    ownerId: row.ownerId,
    daysOnMarket,
    completenessScore,
    messageResponseRate: null,
    isCoOwnership: row.isCoOwnership,
  };
}

export async function buildDealAgentContext(dealId: string): Promise<DealAgentContext | null> {
  const row = await prisma.deal.findUnique({
    where: { id: dealId },
    select: {
      id: true,
      status: true,
      priceCents: true,
      listingId: true,
      brokerId: true,
      milestones: { where: { completedAt: null }, select: { id: true } },
    },
  });
  if (!row) return null;
  return {
    dealId: row.id,
    status: row.status,
    priceCents: row.priceCents,
    listingId: row.listingId,
    brokerId: row.brokerId,
    milestoneOpenCount: row.milestones.length,
  };
}

export async function buildConversationAgentContext(conversationId: string): Promise<ConversationAgentContext | null> {
  const row = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true,
      listingId: true,
      _count: { select: { messages: true } },
    },
  });
  if (!row) return null;
  return {
    conversationId: row.id,
    listingId: row.listingId,
    unreadOrQueued: Math.min(row._count.messages, 20),
  };
}
