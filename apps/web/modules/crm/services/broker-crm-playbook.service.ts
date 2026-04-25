/**
 * STEP 2 — Playbook recommendations for broker CRM leads.
 * Calls playbook-memory with domain LEADS, entityType broker_lead.
 * Returns actions, rationale, confidence (see `LeadPlaybookRec`). Never throws.
 */

import { prisma } from "@/lib/db";
import { getRecommendations } from "@/modules/playbook-memory/services/playbook-memory-retrieval.service";
import { playbookLog } from "@/modules/playbook-memory/playbook-memory.logger";
import { playbookMemoryAssignmentService } from "@/modules/playbook-memory/services/playbook-memory-assignment.service";
import type { PlaybookAssignmentResult, PlaybookBanditContext } from "@/modules/playbook-memory/types/playbook-memory.types";
import type { PlaybookComparableContext } from "@/modules/playbook-memory/types/playbook-memory.types";
import type { PlaybookOrMemoryRecommendation, PlaybookRecommendation } from "@/modules/playbook-memory/types/playbook-memory.types";

export type LeadPlaybookRec = {
  playbookId: string;
  name: string;
  score: number;
  reason: string;
  allowed: boolean;
  /** Model / policy confidence for this row (0–1). */
  confidence: number;
  /** Full rationale lines from playbook-memory. */
  rationale: string[];
  /** Suggested action labels (non-executable hints). */
  actions: string[];
  /** When `allowed` is false, policy block reasons. */
  blockedReasons: string[];
};

function mapRec(r: PlaybookRecommendation): LeadPlaybookRec {
  const rationale = r.rationale?.length ? [...r.rationale] : [r.key || "playbook"];
  const actions: string[] = [];
  if (r.actionType) actions.push(String(r.actionType));
  if (r.name) actions.push(r.name);
  return {
    playbookId: r.playbookId,
    name: r.name,
    score: r.score,
    reason: (rationale[0] ?? r.key) || "playbook",
    allowed: r.allowed,
    confidence: Number.isFinite(r.confidence) ? Math.min(1, Math.max(0, r.confidence)) : r.score,
    rationale,
    actions: [...new Set(actions)].slice(0, 6),
    blockedReasons: r.blockedReasons?.length ? [...r.blockedReasons] : [],
  };
}

/**
 * Playbook recommendations for a broker CRM lead (`leadId`). Suggest-only, no automation.
 * Domain: LEADS · entityType: `broker_lead` for playbook-memory fingerprinting. Never throws.
 */
export async function getLeadRecommendationsWithPlaybooks(leadId: string): Promise<{
  items: LeadPlaybookRec[];
  playbooks: PlaybookRecommendation[];
}> {
  try {
    if (!leadId?.trim()) {
      return { items: [], playbooks: [] };
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
      return { items: [], playbooks: [] };
    }

    const ctx: PlaybookComparableContext = {
      domain: "LEADS",
      entityType: "broker_lead",
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

    const recs = (await getRecommendations({ context: ctx, autonomyMode: "ASSIST" })) as PlaybookOrMemoryRecommendation[];
    const playbooks = recs.filter((x): x is PlaybookRecommendation => x.itemType === "playbook").slice(0, 8);
    return { items: playbooks.map(mapRec), playbooks };
  } catch (e) {
    playbookLog.warn("getLeadRecommendationsWithPlaybooks", { message: e instanceof Error ? e.message : String(e) });
    return { items: [], playbooks: [] };
  }
}

export async function getLeadRecommendations(leadOrId: string | { id: string }): Promise<LeadPlaybookRec[]> {
  const leadId = typeof leadOrId === "string" ? leadOrId : String(leadOrId?.id ?? "");
  const { items } = await getLeadRecommendationsWithPlaybooks(leadId);
  return items;
}

const SUGGESTIONS_ASSIGNMENT_REUSE_MS = 4 * 60 * 60 * 1000;

function rowToAssignmentResult(row: {
  id: string;
  playbookId: string;
  playbookVersionId: string | null;
  selectionMode: "exploit" | "explore" | "manual";
  recommendationScore: number | null;
  selectionScore: number | null;
  executionMode: "RECOMMEND_ONLY" | "HUMAN_APPROVAL" | "SAFE_AUTOPILOT" | "FULL_AUTOPILOT";
}): PlaybookAssignmentResult {
  return {
    assignmentId: row.id,
    playbookId: row.playbookId,
    playbookVersionId: row.playbookVersionId,
    selectionMode: row.selectionMode,
    recommendationScore: row.recommendationScore ?? 0,
    selectionScore: row.selectionScore ?? 0,
    executionMode: row.executionMode,
    rationale: ["Reused recent suggestions-panel assignment to limit duplicate audit rows."],
  };
}

/**
 * CRM playbook suggestions screen: bandit assignment + manual fallback (audit row only).
 * Mirrors autopilot evaluate selection policy without scoring or external side effects. Never throws.
 */
export async function tryAssignPlaybookForBrokerLeadSuggestions(leadId: string): Promise<
  Awaited<ReturnType<typeof playbookMemoryAssignmentService.assignBestOrManualFallback>>
> {
  try {
    if (!leadId?.trim()) {
      return null;
    }
    const since = new Date(Date.now() - SUGGESTIONS_ASSIGNMENT_REUSE_MS);
    const recent = await prisma.playbookAssignment.findFirst({
      where: {
        domain: "LEADS",
        entityType: "broker_lead",
        entityId: leadId,
        createdAt: { gte: since },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        playbookId: true,
        playbookVersionId: true,
        selectionMode: true,
        recommendationScore: true,
        selectionScore: true,
        executionMode: true,
      },
    });
    if (recent) {
      return rowToAssignmentResult(recent);
    }
    const { items: recommendations, playbooks: playbookRecsRaw } = await getLeadRecommendationsWithPlaybooks(leadId);
    const lead = await prisma.lecipmBrokerCrmLead.findUnique({
      where: { id: leadId },
      select: {
        id: true,
        listingId: true,
        status: true,
        source: true,
        priorityLabel: true,
        priorityScore: true,
      },
    });
    if (!lead) {
      return null;
    }
    const allowedPlaybookIds = recommendations.filter((r) => r.allowed).map((r) => r.playbookId);
    const top = recommendations.find((r) => r.allowed) ?? null;
    const bandit: PlaybookBanditContext = {
      domain: "LEADS",
      entityType: "broker_lead",
      entityId: leadId,
      market: undefined,
      segment: {
        source: "broker_crm_playbook_suggestions",
        hasListing: Boolean(lead.listingId),
        wave: "suggestions_panel",
      },
      signals: {
        hasListing: lead.listingId != null,
        status: lead.status,
        priorityLabel: lead.priorityLabel,
      },
      candidatePlaybookIds: allowedPlaybookIds.length ? allowedPlaybookIds : undefined,
    };
    let assignment = await playbookMemoryAssignmentService.assignBestOrManualFallback(bandit);
    if (!assignment && top) {
      const pr = playbookRecsRaw.find((p) => p.playbookId === top.playbookId && p.allowed);
      if (pr) {
        assignment = await playbookMemoryAssignmentService.createManualAssignment({ context: bandit, playbook: pr });
      }
    }
    return assignment;
  } catch (e) {
    playbookLog.warn("tryAssignPlaybookForBrokerLeadSuggestions", {
      message: e instanceof Error ? e.message : String(e),
    });
    return null;
  }
}
