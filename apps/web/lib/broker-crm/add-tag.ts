import { prisma } from "@/lib/db";

export async function addBrokerCrmTag(leadId: string, tag: string) {
  return prisma.lecipmBrokerCrmLeadTag.upsert({
    where: {
      leadId_tag: { leadId, tag },
    },
    create: { leadId, tag },
    update: {},
  });
}
