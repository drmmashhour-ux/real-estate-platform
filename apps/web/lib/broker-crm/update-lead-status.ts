import type { LecipmBrokerCrmLeadStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { trackBrokerCrm } from "@/lib/broker-crm/analytics";

export async function updateBrokerCrmLeadStatus(leadId: string, status: LecipmBrokerCrmLeadStatus, brokerUserId: string) {
  const lead = await prisma.lecipmBrokerCrmLead.update({
    where: { id: leadId },
    data: { status },
  });
  trackBrokerCrm(
    "broker_crm_status_changed",
    { leadId, status },
    { userId: brokerUserId }
  );
  if (status === "contacted") {
    trackBrokerCrm("broker_crm_lead_marked_contacted", { leadId }, { userId: brokerUserId });
  }
  if (status === "qualified") {
    trackBrokerCrm("broker_crm_lead_qualified", { leadId }, { userId: brokerUserId });
  }
  if (status === "closed" || status === "lost") {
    trackBrokerCrm("broker_crm_lead_closed", { leadId, status }, { userId: brokerUserId });
  }
  return lead;
}
