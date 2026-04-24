import { playbookLog } from "@/modules/playbook-memory/playbook-memory.logger";
import { playbookMemoryAssignmentService } from "@/modules/playbook-memory/services/playbook-memory-assignment.service";

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
    return await playbookMemoryAssignmentService.assignBestPlaybook({
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
