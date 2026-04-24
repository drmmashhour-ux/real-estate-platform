import type { LecipmBrokerCrmLeadSource, LecipmBrokerThreadSource, Prisma } from "@prisma/client";
import { logWarn } from "@/lib/logger";
import { trackBrokerCrm } from "@/lib/broker-crm/analytics";
import { scoreBrokerCrmLead } from "@/lib/broker-crm/score-lead";
import { onBrokerCrmLeadCreated } from "@/modules/crm/crm.service";

async function resolveMarketplaceLeadIdForInquiry(
  tx: Prisma.TransactionClient,
  input: {
    listingId: string | null;
    guestEmail: string | null;
    customerUserId: string | null;
  }
): Promise<string | null> {
  if (!input.listingId) return null;
  const emails = new Set<string>();
  if (input.guestEmail?.trim()) emails.add(input.guestEmail.trim());
  if (input.customerUserId) {
    const u = await tx.user.findUnique({
      where: { id: input.customerUserId },
      select: { email: true },
    });
    if (u?.email?.trim()) emails.add(u.email.trim());
  }
  for (const email of emails) {
    const row = await tx.lead.findFirst({
      where: {
        listingId: input.listingId,
        email: { equals: email, mode: "insensitive" },
      },
      select: { id: true },
      orderBy: { createdAt: "desc" },
    });
    if (row) return row.id;
  }
  return null;
}

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
  const marketplaceLeadId = await resolveMarketplaceLeadIdForInquiry(tx, {
    listingId: input.listingId,
    guestEmail: input.guestEmail,
    customerUserId: input.customerUserId,
  });
  return tx.lecipmBrokerCrmLead.create({
    data: {
      threadId: input.threadId,
      listingId: input.listingId,
      brokerUserId: input.brokerUserId,
      customerUserId: input.customerUserId,
      guestName: input.guestName,
      guestEmail: input.guestEmail,
      marketplaceLeadId,
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
  void onBrokerCrmLeadCreated(leadId, brokerUserId).catch((e: unknown) => {
    logWarn("onBrokerCrmLeadCreated_hook_failed", {
      message: e instanceof Error ? e.message : String(e),
      leadId,
    });
  });
  void import("@/modules/playbook-domains/leads/crm-leads-playbook.service").then((m) => {
    try {
      m.scheduleBrokerLeadPlaybookAssignment(leadId);
    } catch {
      /* */
    }
  });
}
