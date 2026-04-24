import { prisma } from "@/lib/db";
import { crmLearningLog } from "@/modules/playbook-memory/playbook-learning-logger";
import { playbookLog } from "@/modules/playbook-memory/playbook-memory.logger";
import { playbookMemoryAssignmentService } from "@/modules/playbook-memory/services/playbook-memory-assignment.service";
import type { PlaybookAssignmentResult } from "@/modules/playbook-memory/types/playbook-memory.types";
import { getDomainModule } from "@/modules/playbook-domains/shared/domain-registry";

/**
 * Inbound CRM inquiry → best-effort bandit assignment (LEADS). Never throws.
 * When no safe candidate, returns null (callers use deterministic / manual flows).
 */
export async function tryCrmPlaybookAssignmentForInquiry(lead: {
  id: string;
  city?: string | null;
  listingId?: string | null;
  leadSource?: string | null;
}): Promise<PlaybookAssignmentResult | null> {
  try {
    try {
      const mod = getDomainModule("LEADS");
      crmLearningLog.info("inquiry_assignment_context", { leadId: lead.id, moduleLoaded: Boolean(mod) });
    } catch {
      crmLearningLog.info("inquiry_assignment_context", { leadId: lead.id, moduleLoaded: false });
    }
    return await playbookMemoryAssignmentService.assignBestOrManualFallback({
      domain: "LEADS",
      entityType: "crm_lead",
      entityId: lead.id,
      market: { city: lead.city ?? undefined },
      segment: {
        source: "inquiry",
        hasListing: Boolean(lead.listingId),
        leadSource: String(lead.leadSource ?? "BUYER"),
      },
      signals: {
        hasListing: lead.listingId != null,
      },
    });
  } catch (e) {
    playbookLog.warn("crm_inquiry_playbook", { message: e instanceof Error ? e.message : String(e) });
    return null;
  }
}

/**
 * New broker CRM thread lead → LEADS assignment (audit row; not executed). Never throws.
 */
export async function tryBrokerLeadPlaybookAssignmentForNewCrmLead(leadId: string): Promise<PlaybookAssignmentResult | null> {
  try {
    const lead = await prisma.lecipmBrokerCrmLead.findUnique({
      where: { id: leadId },
      select: { id: true, listingId: true, source: true, status: true },
    });
    if (!lead) {
      return null;
    }
    return await playbookMemoryAssignmentService.assignBestOrManualFallback({
      domain: "LEADS",
      entityType: "broker_lead",
      entityId: lead.id,
      market: undefined,
      segment: {
        source: "broker_crm_thread",
        hasListing: Boolean(lead.listingId),
        threadSource: String(lead.source ?? "general_inquiry"),
      },
      signals: {
        hasListing: lead.listingId != null,
        status: lead.status,
      },
    });
  } catch (e) {
    playbookLog.warn("broker_lead_playbook_create", { message: e instanceof Error ? e.message : String(e) });
    return null;
  }
}

/** Fire-and-forget broker lead assignment after CRM row insert. Never throws from sync entry. */
export function scheduleBrokerLeadPlaybookAssignment(leadId: string): void {
  void (async () => {
    try {
      const a = await tryBrokerLeadPlaybookAssignmentForNewCrmLead(leadId);
      if (a?.assignmentId) {
        crmLearningLog.info("broker_thread_lead_assigned", { leadId, assignmentId: a.assignmentId });
      }
    } catch {
      /* */
    }
  })();
}
