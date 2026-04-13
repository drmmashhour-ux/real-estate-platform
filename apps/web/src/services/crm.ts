import { prisma } from "@/lib/db";
import { assertBrokerCanReceiveNewLead, formatBrokerBillingBlockReason } from "@/modules/billing/brokerLeadBilling";

export type CreateGrowthLeadInput = {
  userId?: string | null;
  listingId?: string | null;
  /** BNHUB stay id when distinct from generic listingId */
  shortTermListingId?: string | null;
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  leadSource?: string;
};

/**
 * CRM — uses platform `Lead` + `lead_timeline_events` (not a parallel Supabase schema).
 */
export async function createLead(input: CreateGrowthLeadInput) {
  const name = input.name?.trim() || "Lead";
  const email = input.email?.trim() || `growth-lead-${crypto.randomUUID().slice(0, 8)}@placeholder.lecipm`;
  const phone = input.phone?.trim() || "";
  const message = input.message?.trim() || "";

  return prisma.lead.create({
    data: {
      name,
      email,
      phone,
      message,
      listingId: input.listingId ?? undefined,
      shortTermListingId: input.shortTermListingId ?? input.listingId ?? undefined,
      status: "new",
      score: 50,
      userId: input.userId ?? undefined,
      leadSource: input.leadSource ?? "growth_engine",
    },
  });
}

export async function updateLeadStatus(id: string, status: string) {
  return prisma.lead.update({
    where: { id },
    data: { status, pipelineStatus: status },
  });
}

/** Maps to broker assignment field used across LECIPM CRM. */
export async function assignLead(id: string, brokerId: string) {
  const gate = await assertBrokerCanReceiveNewLead(prisma, brokerId);
  if (!gate.ok) throw new Error(formatBrokerBillingBlockReason(gate.reason));
  return prisma.lead.update({
    where: { id },
    data: { introducedByBrokerId: brokerId },
  });
}

export async function addActivity(leadId: string, type: string, note: string) {
  return prisma.leadTimelineEvent.create({
    data: {
      leadId,
      eventType: type,
      payload: { note } as object,
    },
  });
}
