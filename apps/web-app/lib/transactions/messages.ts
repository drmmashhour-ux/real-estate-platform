import { prisma } from "@/lib/db";

export async function sendTransactionMessage(
  transactionId: string,
  senderId: string,
  message: string
): Promise<{ messageId: string }> {
  const tx = await prisma.realEstateTransaction.findUnique({
    where: { id: transactionId },
    select: { buyerId: true, sellerId: true, brokerId: true },
  });
  if (!tx) throw new Error("Transaction not found");
  const allowed = [tx.buyerId, tx.sellerId, tx.brokerId].filter(Boolean).includes(senderId);
  if (!allowed) throw new Error("Only buyer, seller, or broker can send messages");

  const m = await prisma.transactionMessage.create({
    data: { transactionId, senderId, message: message.trim() },
  });
  return { messageId: m.id };
}
