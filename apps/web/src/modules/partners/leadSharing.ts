import { prisma } from "@/lib/db";

/** Audit trail when a partner ingests or mirrors a lead (no separate partner table required). */
export async function shareLeadWithPartner(partnerId: string, leadId: string, externalRef?: string) {
  await prisma.leadTimelineEvent.create({
    data: {
      leadId,
      eventType: "partner_api_share",
      payload: { partnerId, externalRef: externalRef ?? null, at: new Date().toISOString() },
    },
  });
}
