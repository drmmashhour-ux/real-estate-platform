import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function assertUserCanAccessListing(userId: string, role: string, listingId: string): Promise<boolean> {
  if (role === PlatformRole.ADMIN) return true;
  const row = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { ownerId: true },
  });
  return row?.ownerId === userId;
}

export async function assertUserCanAccessDeal(userId: string, role: string, dealId: string): Promise<boolean> {
  if (role === PlatformRole.ADMIN) return true;
  const row = await prisma.deal.findUnique({
    where: { id: dealId },
    select: { buyerId: true, sellerId: true, brokerId: true },
  });
  if (!row) return false;
  return row.buyerId === userId || row.sellerId === userId || row.brokerId === userId;
}

export async function assertUserCanAccessConversation(
  userId: string,
  role: string,
  conversationId: string,
): Promise<boolean> {
  if (role === PlatformRole.ADMIN) return true;
  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      createdById: true,
      participants: { where: { userId }, select: { id: true }, take: 1 },
    },
  });
  if (!conv) return false;
  if (conv.createdById === userId) return true;
  return conv.participants.length > 0;
}
