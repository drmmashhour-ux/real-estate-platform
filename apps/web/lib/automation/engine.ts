/**
 * LECIPM automation engine — rule-based triggers (never blocks user flows; errors logged only).
 */

import { prisma } from "@/lib/db";
import { tierFromScore } from "@/lib/ai/lead-tier";
import { appendLeadTimelineEvent } from "@/lib/leads/timeline-helpers";
import { toStoredPipelineStatus, normalizePipelineStage } from "@/lib/leads/pipeline-stage";

export type AutomationEvent =
  | "evaluation_submitted"
  | "lead_created"
  | "lead_updated"
  | "CTA_clicked"
  | "call_clicked"
  | "whatsapp_clicked";

export type AutomationContext = {
  leadId?: string;
  sessionId?: string | null;
  /** Sub-type e.g. ctaKind from tracking meta */
  channel?: string;
};

const ENGAGEMENT_CAP = 40;
const SCORE_MAX = 100;

function scoreLevelLabel(tier: string): string {
  return tier === "hot" ? "HOT" : tier === "warm" ? "WARM" : "COLD";
}

async function upsertOpenTask(leadId: string, taskKey: string, title: string, dueAt: Date): Promise<void> {
  const exists = await prisma.leadAutomationTask.findFirst({
    where: { leadId, taskKey, status: "open" },
    select: { id: true },
  });
  if (exists) return;
  await prisma.leadAutomationTask.create({
    data: { leadId, taskKey, title, dueAt },
  });
}

/** Recompute score from base signals + engagement (bounded). */
export async function refreshLeadAutomationScoring(leadId: string): Promise<void> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      score: true,
      engagementScore: true,
      highIntent: true,
      dealValue: true,
      pipelineStatus: true,
      aiExplanation: true,
    },
  });
  if (!lead || lead.pipelineStatus === "lost" || lead.pipelineStatus === "won" || lead.pipelineStatus === "closed")
    return;

  const expl = lead.aiExplanation as Record<string, unknown> | null;
  const crm = expl?.crmScoring as { score?: number } | undefined;
  const form = expl?.form as { score?: number } | undefined;
  const merged = expl?.merged as { merged?: number } | undefined;
  let base =
    typeof merged?.merged === "number"
      ? merged.merged
      : typeof crm?.score === "number"
        ? crm.score
        : typeof form?.score === "number"
          ? form.score
          : lead.score;

  let s = base;
  const engBonus = Math.min(8, Math.floor(lead.engagementScore / 5));
  s += engBonus;
  if (lead.highIntent) s += 4;
  if (lead.dealValue != null && lead.dealValue >= 800_000) s += 5;
  if (lead.dealValue != null && lead.dealValue >= 500_000) s += 2;
  s = Math.max(0, Math.min(SCORE_MAX, s));

  const tier = tierFromScore(s);
  await prisma.lead.update({
    where: { id: leadId },
    data: {
      score: s,
      aiTier: tier,
      scoreLevel: scoreLevelLabel(tier),
    },
  });
}

async function bumpEngagement(leadId: string, delta: number): Promise<void> {
  await prisma.lead.update({
    where: { id: leadId },
    data: {
      engagementScore: {
        increment: delta,
      },
    },
  });
  const row = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { engagementScore: true },
  });
  if (row && row.engagementScore > ENGAGEMENT_CAP) {
    await prisma.lead.update({
      where: { id: leadId },
      data: { engagementScore: ENGAGEMENT_CAP },
    });
  }
  await refreshLeadAutomationScoring(leadId);
}

/** Analytics / repeat visits — safe to fire-and-forget from track API. */
export async function bumpLeadEngagement(leadId: string, delta: number): Promise<void> {
  try {
    if (!leadId || leadId.startsWith("mem-")) return;
    await bumpEngagement(leadId, delta);
  } catch (e) {
    console.warn("[automation:engagement]", e);
  }
}

async function onNewLead(leadId: string): Promise<void> {
  const due = new Date(Date.now() + 10 * 60 * 1000);
  await upsertOpenTask(leadId, "sla_first_call", "Call within 10 minutes", due);
  await appendLeadTimelineEvent(leadId, "automation_task_created", {
    taskKey: "sla_first_call",
    dueAt: due.toISOString(),
  });
}

async function onEvaluationSubmitted(leadId: string): Promise<void> {
  await onNewLead(leadId);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  await upsertOpenTask(leadId, "post_eval_check_in", "Follow up tomorrow (evaluation)", tomorrow);
}

async function onContactedPipeline(leadId: string): Promise<void> {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  await upsertOpenTask(leadId, "followup_after_contact", "Follow up tomorrow", tomorrow);
}

async function onQualifiedPipeline(leadId: string): Promise<void> {
  const due = new Date();
  due.setDate(due.getDate() + 2);
  await upsertOpenTask(leadId, "schedule_meeting", "Schedule meeting / confirm slot", due);
}

/**
 * Main entry — fire-and-forget from API routes (wrap in void …).
 */
export async function dispatchAutomation(
  event: AutomationEvent,
  ctx: AutomationContext = {}
): Promise<void> {
  try {
    const leadId = ctx.leadId?.trim();
    if (!leadId || leadId.startsWith("mem-")) {
      if (event !== "lead_updated") return;
    }

    switch (event) {
      case "lead_created":
        if (leadId) await onNewLead(leadId);
        break;
      case "evaluation_submitted":
        if (leadId) await onEvaluationSubmitted(leadId);
        break;
      case "lead_updated":
        if (leadId) await refreshLeadAutomationScoring(leadId);
        break;
      case "CTA_clicked":
        if (leadId) {
          await bumpEngagement(leadId, 2);
        }
        break;
      case "call_clicked":
      case "whatsapp_clicked":
        if (leadId) {
          await bumpEngagement(leadId, 4);
          await prisma.lead
            .update({
              where: { id: leadId },
              data: { highIntent: true },
            })
            .catch(() => {});
        }
        break;
      default:
        break;
    }
  } catch (e) {
    console.warn("[automation:engine]", event, e);
  }
}

/** After broker sets pipeline stage via PATCH (server-side). */
export async function automationOnPipelineStageChange(
  leadId: string,
  newStage: string,
  previousStage: string
): Promise<void> {
  try {
    if (newStage === previousStage) return;
    if (newStage === "contacted" && previousStage === "new") {
      await onContactedPipeline(leadId);
    }
    if (newStage === "qualified" && ["new", "contacted", "follow_up"].includes(previousStage)) {
      await onQualifiedPipeline(leadId);
    }
    await refreshLeadAutomationScoring(leadId);
  } catch (e) {
    console.warn("[automation:pipeline-hook]", e);
  }
}

/** DM replied → move to contacted if still new (idempotent). */
export async function automationOnDmReplied(leadId: string): Promise<void> {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { pipelineStatus: true },
    });
    if (!lead || lead.pipelineStatus !== "new") return;
    const contacted = toStoredPipelineStatus("contacted");
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        pipelineStatus: contacted,
        pipelineStage: normalizePipelineStage(contacted),
        status: contacted,
        highIntent: true,
      },
    });
    await appendLeadTimelineEvent(leadId, "automation_pipeline", {
      reason: "dm_replied",
      to: contacted,
    });
    await onContactedPipeline(leadId);
    await refreshLeadAutomationScoring(leadId);
  } catch (e) {
    console.warn("[automation:dm-replied]", e);
  }
}

/** When meeting is scheduled — advance to meeting_scheduled (broker keeps control; no auto won/lost). */
export async function automationOnMeetingScheduled(leadId: string): Promise<void> {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { pipelineStatus: true, meetingAt: true },
    });
    if (!lead) return;
    const now = new Date();
    const p = lead.pipelineStatus ?? "new";
    const early = p === "new" || p === "contacted" || p === "qualified" || p === "follow_up";
    if (early) {
      const stage = "meeting_scheduled";
      await prisma.lead.update({
        where: { id: leadId },
        data: {
          pipelineStatus: stage,
          pipelineStage: normalizePipelineStage(stage),
          status: stage,
          meetingScheduledAt: now,
        },
      });
      await appendLeadTimelineEvent(leadId, "automation_pipeline", {
        reason: "meeting_scheduled",
        to: stage,
      });
    } else {
      await prisma.lead.update({
        where: { id: leadId },
        data: { meetingScheduledAt: lead.meetingAt ?? now },
      });
    }
    const meetingTs = lead.meetingAt;
    if (meetingTs) {
      const due = new Date(meetingTs.getTime() - 60 * 60 * 1000);
      await upsertOpenTask(
        leadId,
        "meeting_reminder_1h",
        "Reminder: client meeting in ~1 hour — confirm materials",
        due
      );
    }
    await refreshLeadAutomationScoring(leadId);
  } catch (e) {
    console.warn("[automation:meeting]", e);
  }
}
