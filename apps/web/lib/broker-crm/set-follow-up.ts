import { prisma } from "@/lib/db";
import { trackBrokerCrm } from "@/lib/broker-crm/analytics";

export async function setBrokerCrmFollowUp(leadId: string, at: Date | null, brokerUserId: string) {
  const lead = await prisma.lecipmBrokerCrmLead.update({
    where: { id: leadId },
    data: { nextFollowUpAt: at },
  });
  trackBrokerCrm(
    "broker_crm_follow_up_set",
    { leadId, nextFollowUpAt: at?.toISOString() ?? null },
    { userId: brokerUserId }
  );
  return lead;
}
