import { prisma } from "@/lib/db";

export async function listThreadsForUser(userId: string) {
  return prisma.bnhubInquiryThread.findMany({
    where: { OR: [{ guestUserId: userId }, { hostUserId: userId }] },
    orderBy: { lastMessageAt: "desc" },
    take: 40,
    include: {
      listing: { select: { id: true, title: true, listingCode: true, photos: true } },
    },
  });
}
