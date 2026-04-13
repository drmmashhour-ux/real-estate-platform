import { prisma } from "@/lib/db";

export async function getBrokerCrmLeadDetail(leadId: string) {
  return prisma.lecipmBrokerCrmLead.findUnique({
    where: { id: leadId },
    include: {
      listing: { select: { id: true, title: true, listingCode: true, price: true } },
      customer: { select: { id: true, name: true, email: true } },
      thread: {
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
            include: { sender: { select: { id: true, name: true } } },
          },
        },
      },
      notes: { orderBy: { createdAt: "desc" }, take: 50 },
      tags: { orderBy: { createdAt: "desc" } },
      aiInsights: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
}
