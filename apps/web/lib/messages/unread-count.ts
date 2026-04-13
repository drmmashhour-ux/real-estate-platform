import { prisma } from "@/lib/db";

export async function countUnreadLecipmBrokerInbox(brokerUserId: string): Promise<number> {
  return prisma.lecipmBrokerListingMessage.count({
    where: {
      isRead: false,
      senderRole: { in: ["customer", "guest"] },
      thread: { brokerUserId },
    },
  });
}

export async function countUnreadLecipmCustomerInbox(customerUserId: string): Promise<number> {
  return prisma.lecipmBrokerListingMessage.count({
    where: {
      isRead: false,
      senderRole: { in: ["broker", "admin"] },
      thread: { customerUserId },
    },
  });
}
