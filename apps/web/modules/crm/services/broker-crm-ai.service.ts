import { scoreBrokerCrmLead } from "@/lib/broker-crm/score-lead";
import { playbookLog } from "@/modules/playbook-memory/playbook-memory.logger";
import { playbookMemoryWriteService } from "@/modules/playbook-memory/services/playbook-memory-write.service";
import type { PlaybookComparableContext } from "@/modules/playbook-memory/types/playbook-memory.types";
import { prisma } from "@/lib/db";

/** Thermal bucket for CRM UI (mapped from priority bands). */
export type LeadThermalLabel = "hot" | "warm" | "cold";

export type LeadScoreResult = {
  ok: true;
  leadId: string;
  priorityScore: number;
  priorityLabel: string;
  /** Normalized 0–1 (priorityScore / 100, capped). */
  score: number;
  /** hot / warm / cold — aligns with high / medium / low priority bands. */
  label: LeadThermalLabel;
  /** Same as `reasons` — spec-friendly name. */
  rationale: string[];
  /** Plain-language reasons (deterministic, from rules). */
  reasons: string[];
};

export type LeadScoreError = { ok: false; error: string };

function thermalFromPriority(priorityLabel: string): LeadThermalLabel {
  if (priorityLabel === "high") return "hot";
  if (priorityLabel === "medium") return "warm";
  return "cold";
}

function normalizedScore(priorityScore: number): number {
  return Math.min(1, Math.max(0, priorityScore / 100));
}

/**
 * AI Broker Autopilot — lead scoring. Rule-based (existing engine). Integrates playbook-memory. Never throws.
 * Accepts a lead id string or `{ id }` for call-site ergonomics.
 */
export async function scoreLead(leadOrId: string | { id: string }): Promise<LeadScoreResult | LeadScoreError> {
  try {
    const leadId = typeof leadOrId === "string" ? leadOrId : String(leadOrId?.id ?? "");
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
        select: {
          brokerUserId: true,
          status: true,
          source: true,
          listingId: true,
          lastContactAt: true,
          nextFollowUpAt: true,
          thread: { select: { lastMessageAt: true } },
        },
      })
      .catch(() => null);

    if (lead) {
      reasons.push(`Pipeline status: ${lead.status} (internal CRM stage).`);
      reasons.push(`Source channel: ${String(lead.source)}.`);
      if (lead.listingId) {
        reasons.push("Property context: linked listing improves fit scoring.");
      } else {
        reasons.push("No listing linked yet — attach a property when possible for stronger fit.");
      }
      const lastMsg = lead.thread?.lastMessageAt;
      if (lastMsg) {
        const hours = (Date.now() - lastMsg.getTime()) / 3_600_000;
        if (hours <= 24) {
          reasons.push("Recency: thread activity within the last 24h.");
        } else if (hours <= 72) {
          reasons.push("Recency: last message within a few days — consider a timely follow-up.");
        } else {
          reasons.push("Recency: thread has gone quiet — re-engagement may be needed.");
        }
      }
      if (lead.lastContactAt) {
        reasons.push("Responsiveness: broker logged a contact on this lead.");
      }
      if (lead.nextFollowUpAt && lead.nextFollowUpAt.getTime() < Date.now()) {
        reasons.push("Follow-up: scheduled date is in the past — update or complete the touch.");
      }

      const ctx: PlaybookComparableContext = {
        domain: "LEADS",
        entityType: "broker_lead",
        entityId: leadId,
        segment: { source: "broker_crm", wave: "autopilot_scoring" },
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
        })
        .catch((e) => {
          playbookLog.warn("broker_crm_lead_scored memory skipped", {
            message: e instanceof Error ? e.message : String(e),
          });
        });
    }

    const label = thermalFromPriority(priorityLabel);
    const score = normalizedScore(priorityScore);
    return {
      ok: true,
      leadId,
      priorityScore,
      priorityLabel,
      score,
      label,
      rationale: reasons,
      reasons,
    };
  } catch (e) {
    playbookLog.warn("scoreLead failed", { message: e instanceof Error ? e.message : String(e) });
    return { ok: false, error: "score_unavailable" };
  }
}
