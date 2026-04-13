import { prisma } from "@/lib/db";

/** Inserts an admin-role line in the inquiry thread (visible to both sides). */
export async function appendLecipmVisitThreadMessage(threadId: string, body: string): Promise<void> {
  const now = new Date();
  await prisma.$transaction([
    prisma.lecipmBrokerListingMessage.create({
      data: {
        threadId,
        senderUserId: null,
        senderRole: "admin",
        body,
        isRead: false,
      },
    }),
    prisma.lecipmBrokerListingThread.update({
      where: { id: threadId },
      data: { lastMessageAt: now, updatedAt: now },
    }),
  ]);
}
