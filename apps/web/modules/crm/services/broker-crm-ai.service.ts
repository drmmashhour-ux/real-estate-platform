import { scoreBrokerCrmLead } from "@/lib/broker-crm/score-lead";
import { playbookLog } from "@/modules/playbook-memory/playbook-memory.logger";
import { playbookMemoryWriteService } from "@/modules/playbook-memory/services/playbook-memory-write.service";
import type { PlaybookComparableContext } from "@/modules/playbook-memory/types/playbook-memory.types";
import { prisma } from "@/lib/db";

export type LeadScoreResult = {
  ok: true;
  leadId: string;
  priorityScore: number;
  priorityLabel: string;
  /** Plain-language reasons (deterministic, from rules). */
  reasons: string[];
};

export type LeadScoreError = { ok: false; error: string };

/**
 * AI Broker Autopilot — lead scoring. Rule-based (existing engine). Integrates playbook-memory. Never throws.
 */
export async function scoreLead(leadId: string): Promise<LeadScoreResult | LeadScoreError> {
  try {
    if (!leadId?.trim()) {
      return { ok: false, error: "invalid_lead" };
    }
    const { priorityScore, priorityLabel } = await scoreBrokerCrmLead(leadId);
    const reasons: string[] = [];
    if (priorityScore >= 60) {
      reasons.push("High combined engagement and intent signals from thread text and recency.");
    } else if (priorityScore >= 30) {
      reasons.push("Moderate fit — more follow-up or qualification may lift the score.");
    } else {
      reasons.push("Lower priority by current thread signals; re-engagement or discovery may help.");
    }

    const lead = await prisma.lecipmBrokerCrmLead
      .findUnique({
        where: { id: leadId },
        select: { brokerUserId: true, status: true, source: true, listingId: true },
      })
      .catch(() => null);

    if (lead) {
      const ctx: PlaybookComparableContext = {
        domain: "LEADS",
        entityType: "lecipm_broker_crm_lead",
        entityId: leadId,
        segment: { source: "broker_crm" },
        signals: {
          priorityScore,
          priorityLabel,
          status: lead.status,
          leadSource: String(lead.source),
        },
      };
      void playbookMemoryWriteService
        .recordDecision({
          source: "SYSTEM",
          triggerEvent: "crm.broker_lead.scored",
          actionType: "broker_crm_lead_scored",
          brokerId: lead.brokerUserId,
          leadId,
          context: ctx,
          actionPayload: { priorityScore, priorityLabel },
          idempotencyKey: `broker_crm_scored:${leadId}:${Math.floor(Date.now() / 86_400_000)}`,
        })
        .catch((e) => {
          playbookLog.warn("broker_crm_lead_scored memory skipped", {
            message: e instanceof Error ? e.message : String(e),
          });
        });
    }

    return {
      ok: true,
      leadId,
      priorityScore,
      priorityLabel,
      reasons,
    };
  } catch (e) {
    playbookLog.warn("scoreLead failed", { message: e instanceof Error ? e.message : String(e) });
    return { ok: false, error: "score_unavailable" };
  }
}
