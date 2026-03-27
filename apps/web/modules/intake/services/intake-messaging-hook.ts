import { prisma } from "@/lib/db";

/**
 * If a broker–client conversation exists, post a single concise system line (optional, not spammy).
 */
export async function postIntakeSystemMessageIfConversation(params: {
  brokerClientId: string;
  body: string;
}): Promise<void> {
  const conv = await prisma.conversation.findFirst({
    where: { brokerClientId: params.brokerClientId },
    select: { id: true },
  });
  if (!conv) return;

  const broker = await prisma.brokerClient.findUnique({
    where: { id: params.brokerClientId },
    select: { brokerId: true },
  });
  if (!broker) return;

  await prisma.message.create({
    data: {
      conversationId: conv.id,
      senderId: broker.brokerId,
      body: params.body,
      messageType: "SYSTEM",
    },
  });
}
