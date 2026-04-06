import { prisma } from "@/lib/db";

export async function loadConversationMessages(conversationId: string, take = 24) {
  return prisma.managerAiMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take,
  });
}
