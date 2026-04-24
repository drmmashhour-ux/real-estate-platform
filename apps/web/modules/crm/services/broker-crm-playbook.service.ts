import { prisma } from "@/lib/db";
import { getRecommendations } from "@/modules/playbook-memory/services/playbook-memory-retrieval.service";
import { playbookLog } from "@/modules/playbook-memory/playbook-memory.logger";
import type { PlaybookComparableContext } from "@/modules/playbook-memory/types/playbook-memory.types";
import type { PlaybookOrMemoryRecommendation } from "@/modules/playbook-memory/types/playbook-memory.types";

export type LeadPlaybookRec = {
  playbookId: string;
  name: string;
  score: number;
  reason: string;
  allowed: boolean;
};

function mapRec(r: PlaybookOrMemoryRecommendation): LeadPlaybookRec {
  if (r.itemType === "playbook") {
    return {
      playbookId: r.playbookId,
      name: r.name,
      score: r.score,
      reason: (r.rationale[0] ?? r.key) || "playbook",
      allowed: r.allowed,
    };
  }
  return {
    playbookId: r.memoryId,
    name: "memory",
    score: r.score,
    reason: (r.rationale[0] ?? r.actionType) || "memory",
    allowed: r.allowed,
  };
}

/**
 * Playbook recommendations for a broker CRM lead. Suggest-only, no automation. Never throws.
 */
export async function getLeadRecommendations(leadId: string): Promise<LeadPlaybookRec[]> {
  try {
    if (!leadId?.trim()) {
      return [];
    }
    const lead = await prisma.lecipmBrokerCrmLead.findUnique({
      where: { id: leadId },
      select: {
        id: true,
        listingId: true,
        status: true,
        source: true,
        priorityLabel: true,
        priorityScore: true,
        brokerUserId: true,
      },
    });
    if (!lead) {
      return [];
    }

    const ctx: PlaybookComparableContext = {
      domain: "LEADS",
      entityType: "lecipm_broker_crm_lead",
      entityId: leadId,
      market: undefined,
      segment: {
        source: "broker_crm",
        hasListing: Boolean(lead.listingId),
        leadType: "inquiry",
        leadStatus: String(lead.status),
      },
      signals: {
        hasListing: lead.listingId != null,
        status: lead.status,
        priorityLabel: lead.priorityLabel,
        priorityScore: lead.priorityScore,
        leadSource: String(lead.source),
      },
    };

    const recs = await getRecommendations({ context: ctx, autonomyMode: "ASSIST" });
    return recs.slice(0, 8).map(mapRec);
  } catch (e) {
    playbookLog.warn("getLeadRecommendations", { message: e instanceof Error ? e.message : String(e) });
    return [];
  }
}
