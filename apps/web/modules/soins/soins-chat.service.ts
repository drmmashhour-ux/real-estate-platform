import { prisma } from "@/lib/db";

export async function sendMessage(input: { residentId: string; senderId: string; message: string }) {
  const text = input.message.trim();
  if (!text) throw new Error("Empty message");

  return prisma.careChatMessage.create({
    data: {
      residentId: input.residentId,
      senderId: input.senderId,
      message: text,
    },
  });
}

export async function getConversation(residentId: string, take = 80) {
  return prisma.careChatMessage.findMany({
    where: { residentId },
    orderBy: { createdAt: "desc" },
    take,
    include: {
      sender: { select: { id: true, name: true, email: true } },
    },
  });
}
