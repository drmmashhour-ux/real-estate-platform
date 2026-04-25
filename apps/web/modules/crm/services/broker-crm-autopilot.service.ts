/**
 * STEP 4 + 7 — Autopilot: score + playbook recs + safe internal suggestion row + playbook-memory assignment
 * (domain LEADS, entityType broker_lead). Non-blocking. No external messaging / financial execution. Never throws.
 */

import { prisma } from "@/lib/db";
import { crmLog } from "@/modules/crm/crm-pipeline-logger";
import { isAutopilotActionSafe } from "@/modules/crm/autopilot-safety";
import { playbookLog } from "@/modules/playbook-memory/playbook-memory.logger";
import { playbookLearningBridge } from "@/modules/playbook-memory/services/playbook-learning-bridge.service";
import { playbookMemoryAssignmentService } from "@/modules/playbook-memory/services/playbook-memory-assignment.service";
import type { PlaybookBanditContext } from "@/modules/playbook-memory/types/playbook-memory.types";
import { getLeadRecommendationsWithPlaybooks, type LeadPlaybookRec } from "./broker-crm-playbook.service";
import { scoreLead, type LeadScoreError, type LeadScoreResult } from "./broker-crm-ai.service";

export type EvaluateLeadResult = {
  ok: true;
  leadId: string;
  score: LeadScoreResult | LeadScoreError;
  recommendations: LeadPlaybookRec[];
  /** Bandit or manual fallback assignment when a safe candidate exists (audit row; not executed). */
  assignment: Awaited<ReturnType<typeof playbookMemoryAssignmentService.assignBestOrManualFallback>> | null;
  /** @deprecated Use suggestedNextAction */
  suggestedNext: string | null;
  suggestedNextAction: string | null;
  recommendation: LeadPlaybookRec | null;
  /** 0–1 confidence from normalized lead score when scoring succeeded; else low prior. */
  confidence: number;
  /** Aggregated playbook policy blocks (suggest-only; never executed). */
  blockedReasons: string[];
};

function confidenceFromScore(score: LeadScoreResult | LeadScoreError): number {
  if (!score.ok) return 0.35;
  return Math.min(1, Math.max(0.15, score.score));
}

/**
 * Autopilot evaluation: score + recs + playbook-memory assignment + internal suggested action row.
 * No external messaging; no financial/legal automation. Never throws.
 */
export async function evaluateLead(leadOrId: string | { id: string }): Promise<EvaluateLeadResult | { ok: false; error: string }> {
  try {
    const leadId = typeof leadOrId === "string" ? leadOrId : String(leadOrId?.id ?? "");
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
    const { items: recommendations, playbooks: playbookRecsRaw } = await getLeadRecommendationsWithPlaybooks(leadId);
    const allowedPlaybookIds = recommendations.filter((r) => r.allowed).map((r) => r.playbookId);
    const top = recommendations.find((r) => r.allowed) ?? null;

    let assignment: Awaited<ReturnType<typeof playbookMemoryAssignmentService.assignBestOrManualFallback>> | null = null;
    const bandit: PlaybookBanditContext = {
      domain: "LEADS",
      entityType: "broker_lead",
      entityId: leadId,
      market: undefined,
      segment: {
        source: "broker_crm_autopilot",
        hasListing: Boolean(lead.listingId),
        wave: "evaluate_lead",
      },
      signals: {
        hasListing: lead.listingId != null,
        status: lead.status,
        priorityLabel: lead.priorityLabel,
      },
      candidatePlaybookIds: allowedPlaybookIds.length ? allowedPlaybookIds : undefined,
    };
    try {
      assignment = await playbookMemoryAssignmentService.assignBestOrManualFallback(bandit);
    } catch (e) {
      playbookLog.warn("evaluateLead assignment", { message: e instanceof Error ? e.message : String(e) });
    }

    if (!assignment && top) {
      const pr = playbookRecsRaw.find((p) => p.playbookId === top.playbookId && p.allowed);
      if (pr) {
        try {
          assignment = await playbookMemoryAssignmentService.createManualAssignment({ context: bandit, playbook: pr });
        } catch (e) {
          playbookLog.warn("evaluateLead manual assignment for top rec", {
            message: e instanceof Error ? e.message : String(e),
          });
        }
      }
    }
    try {
      playbookLearningBridge.afterBrokerLeadAutopilotEvaluate({ leadId, assignment });
    } catch (e) {
      playbookLog.warn("evaluateLead learning bridge", { message: e instanceof Error ? e.message : String(e) });
    }
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
        const actionType = "mark_qualified";
        if (!recent && isAutopilotActionSafe(actionType, "playbook_recommendation")) {
          await prisma.lecipmBrokerAutopilotAction.create({
            data: {
              brokerUserId: lead.brokerUserId,
              leadId,
              threadId: lead.threadId ?? undefined,
              actionType,
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

    const confidence = confidenceFromScore(score);
    const blockedReasons = [
      ...new Set(
        playbookRecsRaw.flatMap((r) => (r.allowed ? [] : r.blockedReasons?.length ? r.blockedReasons : ["policy_blocked"])),
      ),
    ];
    crmLog.info("autopilot_evaluate_lead", { leadId, confidence, hasAssignment: Boolean(assignment) });

    return {
      ok: true,
      leadId,
      score,
      recommendations,
      assignment,
      suggestedNext,
      suggestedNextAction: suggestedNext,
      recommendation: top,
      confidence,
      blockedReasons,
    };
  } catch (e) {
    playbookLog.warn("evaluateLead", { message: e instanceof Error ? e.message : String(e) });
    const fallbackId =
      typeof leadOrId === "string" ? leadOrId : String((leadOrId as { id?: string })?.id ?? "");
    return {
      ok: true,
      leadId: fallbackId || "unknown",
      score: { ok: false, error: "evaluate_unavailable" },
      recommendations: [],
      assignment: null,
      suggestedNext: "Evaluation paused — open the lead and retry; nothing was auto-sent.",
      suggestedNextAction: "Evaluation paused — open the lead and retry; nothing was auto-sent.",
      recommendation: null,
      confidence: 0.2,
      blockedReasons: [],
    };
  }
}
