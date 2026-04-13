import type { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function findLeadForBrokerScope(leadId: string, userId: string, role: PlatformRole) {
  const lead = await prisma.lecipmBrokerCrmLead.findUnique({
    where: { id: leadId },
  });
  if (!lead) return null;
  if (role === "ADMIN") return lead;
  if (lead.brokerUserId === userId) return lead;
  return null;
}
