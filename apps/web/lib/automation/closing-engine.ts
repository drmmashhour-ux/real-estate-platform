/**
 * Rule-based closing automation — tasks, suggestions, alerts only (no auto won/lost).
 */

import { prisma } from "@/lib/db";
import { appendLeadTimelineEvent } from "@/lib/leads/timeline-helpers";
import { normalizePipelineStage } from "@/lib/leads/pipeline-stage";
import { getNextBestAction } from "@/lib/leads/next-action";
import { sendBrokerClosingAutomationAlert } from "@/lib/email/notifications";
import { FOLLOWUP_TEMPLATES } from "@/lib/leads/followup-templates";

export type ClosingAutomationLead = {
  id: string;
  pipelineStatus: string | null;
  createdAt: Date;
  firstContactAt: Date | null;
  lastContactAt: Date | null;
  lastContactedAt: Date | null;
  qualifiedAt: Date | null;
  meetingAt: Date | null;
  meetingScheduledAt: Date | null;
  closingAt: Date | null;
  score: number;
  highIntent: boolean;
  name: string;
  email: string;
  leadSource: string | null;
};

const TEN_MIN = 10 * 60 * 1000;
const TWENTY_FOUR_H = 24 * 60 * 60 * 1000;
const FORTY_EIGHT_H = 48 * 60 * 60 * 1000;

async function ensureLeadTask(
  leadId: string,
  taskKey: string | null,
  title: string,
  priority: string,
  dueAt: Date | null,
  metadata?: Record<string, unknown>
): Promise<void> {
  if (taskKey) {
    const exists = await prisma.leadTask.findFirst({
      where: { leadId, taskKey, status: "pending" },
      select: { id: true },
    });
    if (exists) return;
  }
  await prisma.leadTask.create({
    data: {
      leadId,
      taskKey: taskKey ?? undefined,
      title,
      status: "pending",
      priority,
      dueAt: dueAt ?? undefined,
      metadata: metadata ? (metadata as object) : undefined,
    },
  });
}

async function timelineOnce(
  leadId: string,
  eventType: string,
  payload: Record<string, unknown>
): Promise<boolean> {
  const existing = await prisma.leadTimelineEvent.findFirst({
    where: { leadId, eventType },
    select: { id: true },
  });
  if (existing) return false;
  await appendLeadTimelineEvent(leadId, eventType, payload);
  return true;
}

function firstTouchAt(lead: ClosingAutomationLead): Date | null {
  return lead.firstContactAt ?? lead.lastContactAt ?? lead.lastContactedAt;
}

/**
 * Apply closing automation rules for a lead. Idempotent per taskKey / timeline dedupe.
 */
export async function runClosingAutomation(lead: ClosingAutomationLead): Promise<void> {
  const stage = normalizePipelineStage(lead.pipelineStatus);
  const now = Date.now();
  const created = lead.createdAt.getTime();

  const next = getNextBestAction({
    pipelineStatus: lead.pipelineStatus,
    lastContactedAt: lead.lastContactedAt ?? lead.lastContactAt,
    meetingAt: lead.meetingAt,
    leadSource: lead.leadSource,
  });

  // Rule 1 — NEW: first contact task + channel hint
  if (stage === "new") {
    await ensureLeadTask(
      lead.id,
      "closing_contact_10m",
      "Contact within 10 minutes",
      "urgent",
      new Date(created + TEN_MIN),
      { suggestChannel: "call", nextBestAction: next.key, openingNote: "Prefer voice for first touch — highest conversion." }
    );
  }

  // Rule 2 — no contact after 10 min (hot / any new)
  if (stage === "new" && !firstTouchAt(lead) && now - created > TEN_MIN) {
    const isHot = lead.score >= 80 || lead.highIntent;
    const first = isHot
      ? await timelineOnce(lead.id, "closing_sla_hot_lead_10m", {
          score: lead.score,
          highIntent: lead.highIntent,
        })
      : false;
    await ensureLeadTask(
      lead.id,
      "closing_sla_10m_missed",
      "URGENT: Lead not contacted within 10 minutes",
      "urgent",
      new Date(),
      { flag: "urgent_contact_sla" }
    );
    if (first && isHot) {
      void sendBrokerClosingAutomationAlert(
        `[LECIPM] Hot SLA: ${lead.name}`,
        `<p>A lead has not been contacted within 10 minutes.</p><p><strong>${lead.name}</strong> — score ${lead.score}, intent ${lead.highIntent ? "high" : "normal"}.</p><p>Open CRM to follow up.</p>`
      );
    }
  }

  // Rule 3 — CONTACTED, no reply 24h (use last contact as proxy for “reply”)
  if (stage === "contacted") {
    const last = firstTouchAt(lead)?.getTime() ?? created;
    if (now - last > TWENTY_FOUR_H) {
      await ensureLeadTask(
        lead.id,
        "closing_followup_24h",
        "Follow-up: no activity 24h+ since last contact — suggest WhatsApp or email",
        "high",
        new Date(now + 2 * 60 * 60 * 1000),
        {
          whatsappHint: FOLLOWUP_TEMPLATES.noReply.slice(0, 120),
          emailHint: FOLLOWUP_TEMPLATES.first,
        }
      );
    }
  }

  // Rule 4 — QUALIFIED, no meeting scheduled
  if (stage === "qualified" && !lead.meetingAt) {
    const firstQ = await timelineOnce(lead.id, "closing_qualified_no_meeting", {
      score: lead.score,
    });
    await ensureLeadTask(
      lead.id,
      "closing_book_meeting",
      "Priority: book consultation / meeting",
      "high",
      new Date(now + 24 * 60 * 60 * 1000),
      { suggest: "book_call", priority: true }
    );
    if (firstQ) {
      void sendBrokerClosingAutomationAlert(
        `[LECIPM] Qualified — book meeting: ${lead.name}`,
        `<p>A qualified lead has no meeting on file.</p><p><strong>${lead.name}</strong> — please schedule a consultation.</p>`
      );
    }
  }

  // Rule 5 — NEGOTIATION, stale 48h (use last contact)
  if (stage === "negotiation") {
    const last =
      lead.lastContactAt?.getTime() ??
      lead.lastContactedAt?.getTime() ??
      lead.qualifiedAt?.getTime() ??
      created;
    if (now - last > FORTY_EIGHT_H) {
      await ensureLeadTask(
        lead.id,
        "closing_negotiation_stale_48h",
        "Closing reminder: no activity 48h — use objection script + nudge to close",
        "high",
        new Date(),
        {
          objectionScript:
            "If timing or commission is the concern, reaffirm net outcome and offer a simple next step (paperwork review or short follow-up call).",
        }
      );
    }
  }

  // Closing stage: similar stale check
  if (stage === "closing") {
    const last =
      lead.lastContactAt?.getTime() ??
      lead.lastContactedAt?.getTime() ??
      lead.closingAt?.getTime() ??
      created;
    if (now - last > FORTY_EIGHT_H) {
      const firstAlert = await timelineOnce(lead.id, "closing_stage_stale_48h", {});
      await ensureLeadTask(
        lead.id,
        "closing_stage_followup_48h",
        "Closing stage inactive 48h — schedule final call or send closing follow-up",
        "urgent",
        new Date(),
        {}
      );
      if (firstAlert) {
        void sendBrokerClosingAutomationAlert(
          `[LECIPM] Closing idle: ${lead.name}`,
          `<p>A lead in <strong>closing</strong> has had no activity for 48h.</p>`
        );
      }
    }
  }
}

export async function runClosingAutomationById(leadId: string): Promise<void> {
  if (!leadId || leadId.startsWith("mem-")) return;
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      id: true,
      pipelineStatus: true,
      createdAt: true,
      firstContactAt: true,
      lastContactAt: true,
      lastContactedAt: true,
      qualifiedAt: true,
      meetingAt: true,
      meetingScheduledAt: true,
      closingAt: true,
      score: true,
      highIntent: true,
      name: true,
      email: true,
      leadSource: true,
    },
  });
  if (!lead) return;
  await runClosingAutomation(lead as ClosingAutomationLead);
}
