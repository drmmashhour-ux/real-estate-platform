/**
 * Controlled writes to `Lead` ai* fields only — gated; no outbound comms; reversible by clearing ai* in admin/ops.
 */

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import { aiAutopilotLeadsExecutionFlags, aiAutopilotMessagingAssistFlags } from "@/config/feature-flags";
import type { AiAutopilotAction } from "./ai-autopilot.types";
import { buildReplyDraftsForLeads } from "./ai-autopilot-messaging-bulk.service";
import { leadRowToMessagingInput } from "./ai-autopilot-messaging-mapper";
import { mergeAiMessagingAssistIntoExplanation } from "./ai-autopilot-messaging-persist";
import type { AiMessagingAssistDraft } from "./ai-autopilot-messaging.types";
import { executeFollowUpWorkflow } from "./ai-autopilot-followup-execution.service";

export type LeadAutopilotRow = {
  id: string;
  phone: string;
  message: string;
  createdAt: Date;
};

const VERSION = "v1";

function clampScore(n: number): number {
  return Math.min(100, Math.max(0, Math.round(n)));
}

/** Rule-based score 0–100 (autopilot layer; independent of legacy `Lead.score`). */
export function computeLeadAutopilotScore(lead: LeadAutopilotRow): number {
  let score = 50;
  const phone = lead.phone?.trim() ?? "";
  if (phone.length > 0) score += 20;
  const msg = lead.message?.trim() ?? "";
  if (msg.length > 20) score += 20;
  const ageMs = Date.now() - lead.createdAt.getTime();
  if (ageMs < 24 * 60 * 60 * 1000) score += 10;
  return clampScore(score);
}

export function priorityFromScore(score: number): "low" | "medium" | "high" {
  if (score >= 70) return "high";
  if (score >= 45) return "medium";
  return "low";
}

export function buildLeadAutopilotTags(lead: LeadAutopilotRow, score: number): string[] {
  const tags = new Set<string>();
  const msg = lead.message?.trim() ?? "";
  const phone = lead.phone?.trim() ?? "";
  if (score >= 70) tags.add("high_intent");
  if (msg.length <= 20 || phone.length === 0) tags.add("low_info");
  const ageMs = Date.now() - lead.createdAt.getTime();
  if (ageMs >= 24 * 60 * 60 * 1000 && score < 70) tags.add("needs_followup");
  return [...tags];
}

/**
 * Batch-update Lead ai* columns from approved autopilot "ap-leads-*" actions.
 */
export async function executeLeadsActions(
  _actions: AiAutopilotAction[],
  leads: LeadAutopilotRow[],
  _ctx?: { actorUserId?: string },
): Promise<{ updated: number }> {
  if (!aiAutopilotLeadsExecutionFlags.leadsExecutionV1) {
    return { updated: 0 };
  }

  const scoring = aiAutopilotLeadsExecutionFlags.leadsScoringV1;
  const tagging = aiAutopilotLeadsExecutionFlags.leadsTaggingV1;
  if (!scoring && !tagging) {
    return { updated: 0 };
  }

  let updated = 0;
  const now = new Date();

  for (const lead of leads) {
    const computedScore = computeLeadAutopilotScore(lead);
    const priority = priorityFromScore(computedScore);
    const tagList = tagging ? buildLeadAutopilotTags(lead, computedScore) : null;

    const data: Prisma.LeadUpdateInput = {
      aiLastUpdated: now,
      aiExecutionVersion: VERSION,
    };

    if (scoring) {
      data.aiScore = computedScore;
      data.aiPriority = priority;
    }
    if (tagging && tagList) {
      data.aiTags = tagList as unknown as Prisma.InputJsonValue;
    }

    await prisma.lead.update({
      where: { id: lead.id },
      data,
    });

    logInfo("[autopilot:leads:execute]", {
      leadId: lead.id,
      score: scoring ? computedScore : null,
      priority: scoring ? priority : null,
      tags: tagging ? tagList : null,
    });
    updated += 1;
  }

  return { updated };
}

/** Load recent leads and run the autopilot layer (used by controlled execution). */
export async function executeLeadsAutopilotLayer(
  action: AiAutopilotAction,
  actorUserId: string,
): Promise<{ updated: number }> {
  void action;
  void actorUserId;
  const leads = await prisma.lead.findMany({
    take: 200,
    orderBy: { createdAt: "desc" },
    select: { id: true, phone: true, message: true, createdAt: true },
  });
  const exec = await executeLeadsActions([action], leads, { actorUserId });

  const needExtended =
    aiAutopilotMessagingAssistFlags.messagingAssistV1 || aiAutopilotFollowupFlags.followupV1;
  if (needExtended) {
    try {
      const extendedSelect = {
        id: true,
        name: true,
        email: true,
        phone: true,
        message: true,
        listingId: true,
        listingCode: true,
        aiScore: true,
        aiPriority: true,
        aiTags: true,
        createdAt: true,
        aiExplanation: true,
        lastContactedAt: true,
        launchSalesContacted: true,
        launchLastContactDate: true,
        pipelineStatus: true,
      } as const;

      let batch = await prisma.lead.findMany({
        take: 200,
        orderBy: { createdAt: "desc" },
        select: extendedSelect,
      });

      if (aiAutopilotMessagingAssistFlags.messagingAssistV1) {
        const inputs = batch.map(leadRowToMessagingInput);
        const drafts = buildReplyDraftsForLeads(inputs);
        for (const d of drafts) {
          try {
            const row = batch.find((r) => r.id === d.leadId);
            if (!row) continue;
            const assistPayload: AiMessagingAssistDraft = {
              version: "v1",
              suggestedReply: d.suggestedReply,
              tone: d.tone,
              rationale: d.rationale,
              generatedAt: d.createdAt,
            };
            await prisma.lead.update({
              where: { id: d.leadId },
              data: {
                aiExplanation: mergeAiMessagingAssistIntoExplanation(row.aiExplanation, assistPayload),
              },
            });
          } catch {
            /* best-effort per lead */
          }
        }
        if (aiAutopilotFollowupFlags.followupV1) {
          batch = await prisma.lead.findMany({
            take: 200,
            orderBy: { createdAt: "desc" },
            select: extendedSelect,
          });
        }
      }

      if (aiAutopilotFollowupFlags.followupV1) {
        await executeFollowUpWorkflow(batch);
      }
    } catch {
      /* best-effort — core autopilot result still returned */
    }
  }

  return exec;
}
