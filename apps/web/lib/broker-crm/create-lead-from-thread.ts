import type { LecipmBrokerCrmLeadSource, LecipmBrokerThreadSource, Prisma } from "@prisma/client";
import { trackBrokerCrm } from "@/lib/broker-crm/analytics";
import { scoreBrokerCrmLead } from "@/lib/broker-crm/score-lead";

export function mapThreadSourceToCrmSource(src: LecipmBrokerThreadSource): LecipmBrokerCrmLeadSource {
  if (src === "listing_contact") return "listing_contact";
  if (src === "broker_profile") return "broker_profile";
  if (src === "general_inquiry") return "general_inquiry";
  return "general_inquiry";
}

export async function createBrokerCrmLeadForNewThread(
  tx: Prisma.TransactionClient,
  input: {
    threadId: string;
    listingId: string | null;
    brokerUserId: string;
    customerUserId: string | null;
    guestName: string | null;
    guestEmail: string | null;
    threadSource: LecipmBrokerThreadSource;
  }
) {
  return tx.lecipmBrokerCrmLead.create({
    data: {
      threadId: input.threadId,
      listingId: input.listingId,
      brokerUserId: input.brokerUserId,
      customerUserId: input.customerUserId,
      guestName: input.guestName,
      guestEmail: input.guestEmail,
      source: mapThreadSourceToCrmSource(input.threadSource),
      status: "new",
    },
  });
}

export function scheduleScoreNewLead(leadId: string, brokerUserId: string): void {
  void scoreBrokerCrmLead(leadId).catch(() => {});
  trackBrokerCrm(
    "broker_crm_lead_created",
    { leadId },
    { userId: brokerUserId }
  );
}
