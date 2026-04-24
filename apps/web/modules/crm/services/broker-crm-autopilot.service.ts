import { prisma } from "@/lib/db";
import { playbookLog } from "@/modules/playbook-memory/playbook-memory.logger";
import { playbookMemoryAssignmentService } from "@/modules/playbook-memory/services/playbook-memory-assignment.service";
import type { PlaybookBanditContext } from "@/modules/playbook-memory/types/playbook-memory.types";
import { getLeadRecommendations, type LeadPlaybookRec } from "./broker-crm-playbook.service";
import { scoreLead, type LeadScoreError, type LeadScoreResult } from "./broker-crm-ai.service";

export type EvaluateLeadResult = {
  ok: true;
  leadId: string;
  score: LeadScoreResult | LeadScoreError;
  recommendations: LeadPlaybookRec[];
  /** Bandit assignment when a safe candidate exists. */
  assignment: Awaited<ReturnType<typeof playbookMemoryAssignmentService.assignBestPlaybook>> | null;
  /** One-line for CRM UI. */
  suggestedNext: string | null;
};

/**
 * Autopilot evaluation: score + recs + optional playbook assignment + internal suggested action row. Never throws.
 */
export async function evaluateLead(leadId: string): Promise<EvaluateLeadResult | { ok: false; error: string }> {
  try {
    if (!leadId?.trim()) {
      return { ok: false, error: "invalid_lead" };
    }
    const lead = await prisma.lecipmBrokerCrmLead.findUnique({
      where: { id: leadId },
      select: {
        id: true,
        brokerUserId: true,
        listingId: true,
        status: true,
        source: true,
        priorityLabel: true,
        priorityScore: true,
        threadId: true,
      },
    });
    if (!lead) {
      return { ok: false, error: "not_found" };
    }

    const score = await scoreLead(leadId);
    const recommendations = await getLeadRecommendations(leadId);

    let assignment: Awaited<ReturnType<typeof playbookMemoryAssignmentService.assignBestPlaybook>> | null = null;
    try {
      const allowedIds = recommendations.filter((r) => r.allowed).map((r) => r.playbookId);
      const bandit: PlaybookBanditContext = {
        domain: "LEADS",
        entityType: "lecipm_broker_crm_lead",
        entityId: leadId,
        market: undefined,
        segment: {
          source: "broker_crm_autopilot",
          hasListing: Boolean(lead.listingId),
        },
        signals: {
          hasListing: lead.listingId != null,
          status: lead.status,
          priorityLabel: lead.priorityLabel,
        },
        candidatePlaybookIds: allowedIds.length ? allowedIds : undefined,
      };
      assignment = await playbookMemoryAssignmentService.assignBestPlaybook(bandit);
    } catch (e) {
      playbookLog.warn("evaluateLead assignment", { message: e instanceof Error ? e.message : String(e) });
    }

    const top = recommendations.find((r) => r.allowed) ?? null;
    let suggestedNext: string | null = null;
    if (top) {
      suggestedNext = `Review playbook “${top.name}” — ${top.reason.slice(0, 160)}`;
    } else if (score.ok && score.priorityLabel === "high") {
      suggestedNext = "High-priority lead — follow up in-app; no auto-messages are sent.";
    } else {
      suggestedNext = "Log an interaction and set a follow-up to keep momentum.";
    }

    if (top) {
      try {
        const recent = await prisma.lecipmBrokerAutopilotAction.findFirst({
          where: {
            leadId,
            reasonBucket: "playbook_recommendation",
            status: { in: ["suggested", "queued"] },
            createdAt: { gte: new Date(Date.now() - 36 * 60 * 60 * 1000) },
          },
        });
        if (!recent) {
          await prisma.lecipmBrokerAutopilotAction.create({
            data: {
              brokerUserId: lead.brokerUserId,
              leadId,
              threadId: lead.threadId ?? undefined,
              actionType: "mark_qualified",
              status: "suggested",
              title: `Playbook: ${top.name}`.slice(0, 512),
              reason: top.reason,
              reasonBucket: "playbook_recommendation",
            },
          });
        }
      } catch (e) {
        playbookLog.warn("autopilot action create skipped", { message: e instanceof Error ? e.message : String(e) });
      }
    }

    return {
      ok: true,
      leadId,
      score,
      recommendations,
      assignment,
      suggestedNext,
    };
  } catch (e) {
    playbookLog.warn("evaluateLead", { message: e instanceof Error ? e.message : String(e) });
    return { ok: false, error: "evaluate_unavailable" };
  }
}
