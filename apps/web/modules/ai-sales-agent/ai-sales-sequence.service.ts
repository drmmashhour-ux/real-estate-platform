import { prisma } from "@/lib/db";
import { sendTransactionalEmail } from "@/lib/email/provider";

import {
  sendCentrisBrokerInvitationEmail,
  sendCentrisSimilarListingsEmail,
  sendCentrisUrgencyFollowUpEmail,
} from "../centris-conversion/centris-followup.service";

import { buildAiSalesFirstResponsePlain, buildAiSalesFollowUpValue } from "./ai-sales-message.service";
import { recordAiSalesEvent } from "./ai-sales-log.service";
import { getAiSalesAgentConfig } from "./ai-sales-config.service";
import type { AiSalesMode, AiSalesTrigger } from "./ai-sales.types";

const PREFIX = "ai_sales_seq_";

async function listingMeta(leadId: string): Promise<{ title: string | undefined; listingId: string | null }> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { fsboListingId: true, listingId: true },
  });
  if (!lead) return { title: undefined, listingId: null };
  const lid = lead.fsboListingId ?? lead.listingId;
  if (!lid) return { title: undefined, listingId: null };

  if (lead.fsboListingId) {
    const fsbo = await prisma.fsboListing.findUnique({
      where: { id: lead.fsboListingId },
      select: { title: true },
    });
    return { title: fsbo?.title ?? undefined, listingId: lid };
  }

  const crm = await prisma.listing.findUnique({
    where: { id: lead.listingId as string },
    select: { title: true },
  });
  return { title: crm?.title ?? undefined, listingId: lid };
}

/** Stops automated sequence — user reply detection is augmented by opt-out + explicit flags. */
export async function shouldStopAiSalesSequence(leadId: string): Promise<boolean> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      optedOutOfFollowUp: true,
      pipelineStatus: true,
      aiExplanation: true,
    },
  });
  if (!lead) return true;
  if (lead.optedOutOfFollowUp) return true;

  const ex = (lead.aiExplanation as Record<string, unknown> | null)?.aiSales as
    | { sequenceStopped?: boolean }
    | undefined;
  if (ex?.sequenceStopped) return true;

  const recentUserSignal = await prisma.leadTimelineEvent.findFirst({
    where: {
      leadId,
      OR: [{ eventType: "AI_SALES_INBOUND" }, { eventType: "AI_SALES_SEQUENCE_STOPPED" }],
      createdAt: { gte: new Date(Date.now() - 30 * 24 * 3600000) },
    },
  });
  if (recentUserSignal) return true;

  return false;
}

export async function markAiSalesSequenceStopped(leadId: string, reason: string): Promise<void> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { aiExplanation: true },
  });
  const prev = (lead?.aiExplanation as Record<string, unknown> | null) ?? {};
  await prisma.lead.update({
    where: { id: leadId },
    data: {
      aiExplanation: {
        ...prev,
        aiSales: {
          ...((prev.aiSales as object) ?? {}),
          sequenceStopped: true,
          stoppedReason: reason,
          stoppedAt: new Date().toISOString(),
        },
      },
    },
  });
  await recordAiSalesEvent(leadId, "AI_SALES_SEQUENCE_STOPPED", {
    assistant: "lecipm",
    mode: "SAFE_AUTOPILOT",
    explain: reason,
  });
}

/**
 * Marketing / nurture steps require `consentMarketing`.
 * Schedule: d1 +24h, d2 +48h, d3 +72h, d5 +120h (aligned with Centris domination offsets).
 */
export async function scheduleAiSalesNurtureSequence(params: {
  leadId: string;
  consentMarketing: boolean;
  mode: AiSalesMode;
}): Promise<void> {
  if (!params.consentMarketing) return;
  const stop = await shouldStopAiSalesSequence(params.leadId);
  if (stop) return;

  const offsets: { jobKey: string; hours: number }[] = [
    { jobKey: `${PREFIX}d1_followup`, hours: 24 },
    { jobKey: `${PREFIX}d2_similar`, hours: 48 },
    { jobKey: `${PREFIX}d3_urgency`, hours: 72 },
    { jobKey: `${PREFIX}d5_final`, hours: 120 },
  ];

  const base = Date.now();
  for (const { jobKey, hours } of offsets) {
    const exists = await prisma.leadFollowUpJob.findFirst({
      where: { leadId: params.leadId, jobKey },
    });
    if (exists) continue;

    await prisma.leadFollowUpJob.create({
      data: {
        leadId: params.leadId,
        jobKey,
        scheduledFor: new Date(base + hours * 3600000),
        status: "pending",
      },
    });
  }

  const lead = await prisma.lead.findUnique({
    where: { id: params.leadId },
    select: { aiExplanation: true },
  });
  const prev = (lead?.aiExplanation as Record<string, unknown> | null) ?? {};
  await prisma.lead.update({
    where: { id: params.leadId },
    data: {
      aiExplanation: {
        ...prev,
        aiSales: {
          ...((prev.aiSales as object) ?? {}),
          nurtureScheduledAt: new Date().toISOString(),
          mode: params.mode,
        },
      },
    },
  });

  await recordAiSalesEvent(params.leadId, "AI_SALES_SEQUENCE_SCHEDULED", {
    assistant: "lecipm",
    mode: params.mode,
    explain: "nurture_offsets",
  });
}

export async function sendInstantAiSalesEmail(params: {
  toEmail: string;
  leadId: string;
  listingTitle?: string | null;
  trigger: AiSalesTrigger;
  mode: AiSalesMode;
}): Promise<boolean> {
  try {
    const bundle = buildAiSalesFirstResponsePlain({
      leadId: params.leadId,
      listingTitle: params.listingTitle,
      trigger: params.trigger,
      mode: params.mode,
    });
    await sendTransactionalEmail({
      to: params.toEmail,
      subject: bundle.subject,
      html: bundle.html,
      template: "ai_sales_first_response",
    });
    await recordAiSalesEvent(params.leadId, "AI_SALES_MESSAGE_SENT", {
      assistant: "lecipm",
      mode: params.mode,
      trigger: params.trigger,
      channel: "email",
      explain: "first_response_sent",
      templateKey: "ai_sales_first_response",
      subject: bundle.subject,
    });
    return true;
  } catch {
    return false;
  }
}

/** Cron-oriented: processes `ai_sales_seq_*` jobs (and stays clear of `centris_domination_*`). */
export async function processDueAiSalesSequenceJobs(limit = 40): Promise<number> {
  const cfg = await getAiSalesAgentConfig();
  if (cfg.mode === "OFF") return 0;

  const jobs = await prisma.leadFollowUpJob.findMany({
    where: {
      status: "pending",
      scheduledFor: { lte: new Date() },
      jobKey: { startsWith: PREFIX },
    },
    orderBy: { scheduledFor: "asc" },
    take: limit,
    include: {
      lead: {
        select: {
          email: true,
          optedOutOfFollowUp: true,
        },
      },
    },
  });

  let processed = 0;

  for (const job of jobs) {
    const email = job.lead.email?.trim();
    if (!email || email.includes("@phone-only.invalid") || email.includes("@lecipm.local")) {
      await prisma.leadFollowUpJob.update({
        where: { id: job.id },
        data: { status: "skipped", processedAt: new Date(), lastError: "no_email" },
      });
      continue;
    }

    if (job.lead.optedOutOfFollowUp || (await shouldStopAiSalesSequence(job.leadId))) {
      await prisma.leadFollowUpJob.update({
        where: { id: job.id },
        data: { status: "skipped", processedAt: new Date(), lastError: "stop_or_opt_out" },
      });
      continue;
    }

    const meta = await listingMeta(job.leadId);
    const listingId = meta.listingId ?? "";

    try {
      if (job.jobKey === `${PREFIX}d1_followup`) {
        const msg = buildAiSalesFollowUpValue({
          leadId: job.leadId,
          listingTitle: meta.title,
          mode: cfg.mode,
        });
        await sendTransactionalEmail({
          to: email,
          subject: msg.subject,
          html: msg.html,
          template: "ai_sales_followup_d1",
        });
        await recordAiSalesEvent(job.leadId, "AI_SALES_MESSAGE_SENT", {
          assistant: "lecipm",
          mode: cfg.mode,
          channel: "email",
          explain: "d1_followup",
          subject: msg.subject,
        });
      } else if (job.jobKey === `${PREFIX}d2_similar`) {
        await sendCentrisSimilarListingsEmail({
          toEmail: email,
          leadId: job.leadId,
          listingTitle: meta.title,
        });
        await recordAiSalesEvent(job.leadId, "AI_SALES_MESSAGE_SENT", {
          assistant: "lecipm",
          mode: cfg.mode,
          channel: "email",
          explain: "d2_similar_reused",
        });
      } else if (job.jobKey === `${PREFIX}d3_urgency`) {
        if (!listingId) throw new Error("missing_listing");
        await sendCentrisUrgencyFollowUpEmail({
          toEmail: email,
          leadId: job.leadId,
          listingId,
          listingTitle: meta.title,
        });
        await recordAiSalesEvent(job.leadId, "AI_SALES_MESSAGE_SENT", {
          assistant: "lecipm",
          mode: cfg.mode,
          channel: "email",
          explain: "d3_urgency_reused",
        });
      } else if (job.jobKey === `${PREFIX}d5_final`) {
        await sendCentrisBrokerInvitationEmail({
          toEmail: email,
          leadId: job.leadId,
          listingTitle: meta.title,
        });
        await recordAiSalesEvent(job.leadId, "AI_SALES_MESSAGE_SENT", {
          assistant: "lecipm",
          mode: cfg.mode,
          channel: "email",
          explain: "d5_broker_invite_reused",
        });
      }

      await prisma.leadFollowUpJob.update({
        where: { id: job.id },
        data: { status: "completed", processedAt: new Date(), lastError: null },
      });
      processed++;
    } catch (e) {
      await prisma.leadFollowUpJob.update({
        where: { id: job.id },
        data: {
          status: "failed",
          processedAt: new Date(),
          lastError: e instanceof Error ? e.message : "unknown",
        },
      });
    }
  }

  return processed;
}
