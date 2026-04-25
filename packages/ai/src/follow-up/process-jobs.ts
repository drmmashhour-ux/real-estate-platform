import { prisma } from "@/lib/db";
import { getFollowUpSettings } from "./settings";
import { appendLeadTimeline } from "./timeline";
import { normalizeToE164 } from "@/modules/messaging/services/phone-normalize";
import { sendTwilioSms, isTwilioSmsConfigured } from "@/modules/messaging/services/twilio-sms";
import { detectLocaleFromHint, renderFollowUpTemplate, type FollowUpLocale, type TemplateKey } from "./templates";
import { hasInboundAfter } from "./orchestrator";
import { escalateLeadToBroker } from "./escalation";
import { classifyInboundSafety, SAFETY_REPLY } from "./safety";
import { sendAutomatedEvaluationEmail } from "@/lib/leads/send-automated-eval-email";
import { EMAIL_2_KEY, EMAIL_3_KEY } from "@/lib/leads/schedule-eval-email-jobs";
import { CRM_JOB_BNHUB_BOOKING_THANKS_EMAIL } from "@/lib/crm/internal-crm-constants";
import { sendBnhubBookingThanksEmail } from "@/lib/crm/bnhub-booking-thanks-email";

async function latestConsent(leadId: string) {
  return prisma.leadContactConsent.findFirst({
    where: { leadId },
    orderBy: { createdAt: "desc" },
  });
}

async function sendSmsTemplate(
  leadId: string,
  templateKey: TemplateKey,
  locale: FollowUpLocale
): Promise<boolean> {
  const settings = await getFollowUpSettings();
  if (!settings.enableSms || !isTwilioSmsConfigured()) return false;
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead?.phone || lead.optedOutOfFollowUp) return false;
  const consent = await latestConsent(leadId);
  if (settings.requireExplicitConsent && !consent?.consentSmsWhatsapp) return false;

  const listing = lead.listingId
    ? await prisma.shortTermListing.findUnique({
        where: { id: lead.listingId },
        select: { title: true, city: true },
      })
    : null;

  const body = renderFollowUpTemplate(templateKey, locale, lead, {
    listingTitle: listing?.title ?? null,
    city: listing?.city ?? null,
  });
  const e164 = normalizeToE164(lead.phone);
  if (!e164) return false;

  const r = await sendTwilioSms({ toE164: e164, body: body.slice(0, 1500) });
  await prisma.leadCommMessage.create({
    data: {
      leadId,
      direction: "outbound",
      channel: "sms",
      templateKey,
      body,
      status: r.ok ? "sent" : "failed",
      locale,
      externalId: r.sid,
    },
  });
  return r.ok;
}

export async function processDueFollowUpJobs(limit = 40): Promise<{ processed: number }> {
  const now = new Date();
  const jobs = await prisma.leadFollowUpJob.findMany({
    where: { status: "pending", scheduledFor: { lte: now } },
    orderBy: { scheduledFor: "asc" },
    take: limit,
  });

  let processed = 0;
  for (const job of jobs) {
    await prisma.leadFollowUpJob.update({
      where: { id: job.id },
      data: { status: "processing" },
    });

    try {
      const lead = await prisma.lead.findUnique({ where: { id: job.leadId } });
      if (!lead || lead.optedOutOfFollowUp || lead.pipelineStatus === "lost" || lead.pipelineStatus === "closed") {
        await prisma.leadFollowUpJob.update({
          where: { id: job.id },
          data: { status: "skipped", processedAt: new Date() },
        });
        processed += 1;
        continue;
      }

      const consent = await latestConsent(lead.id);
      const locale = detectLocaleFromHint(consent?.locale);

      if (job.jobKey === "voice_hot") {
        const settings = await getFollowUpSettings();
        if (!settings.enableVoice || !consent?.consentVoice) {
          await prisma.leadFollowUpJob.update({
            where: { id: job.id },
            data: { status: "skipped", processedAt: new Date() },
          });
          processed += 1;
          continue;
        }
        const script = renderFollowUpTemplate("voice_script_intro", locale, lead, {
          listingTitle: null,
          city: null,
        });
        await prisma.leadCommMessage.create({
          data: {
            leadId: lead.id,
            direction: "outbound",
            channel: "voice",
            templateKey: "voice_script_intro",
            body: script,
            status: "queued",
            locale,
            metadata: { note: "Queue for voice provider (Twilio Voice / vendor)" },
          },
        });
        await appendLeadTimeline(lead.id, "voice_call_queued", { jobId: job.id });
        await prisma.leadFollowUpJob.update({
          where: { id: job.id },
          data: { status: "completed", processedAt: new Date() },
        });
        processed += 1;
        continue;
      }

      const firstOut = await prisma.leadCommMessage.findFirst({
        where: { leadId: lead.id, direction: "outbound" },
        orderBy: { createdAt: "asc" },
      });

      if (job.jobKey === "nudge_30m") {
        if (!firstOut) {
          await prisma.leadFollowUpJob.update({
            where: { id: job.id },
            data: { status: "skipped", processedAt: new Date() },
          });
        } else {
          const replied = await hasInboundAfter(lead.id, firstOut.createdAt);
          if (!replied) {
            const ok = await sendSmsTemplate(lead.id, "no_response_follow_up", locale);
            if (ok) await appendLeadTimeline(lead.id, "follow_up_nudge_sent", { jobKey: job.jobKey });
          }
          await prisma.leadFollowUpJob.update({
            where: { id: job.id },
            data: { status: "completed", processedAt: new Date() },
          });
        }
        processed += 1;
        continue;
      }

      if (job.jobKey === "day1") {
        if (!firstOut) {
          await prisma.leadFollowUpJob.update({
            where: { id: job.id },
            data: { status: "skipped", processedAt: new Date() },
          });
        } else {
          const replied = await hasInboundAfter(lead.id, firstOut.createdAt);
          if (!replied) {
            const ok = await sendSmsTemplate(lead.id, "viewing_invitation", locale);
            if (ok) await appendLeadTimeline(lead.id, "follow_up_day1_sent", {});
          }
          await prisma.leadFollowUpJob.update({
            where: { id: job.id },
            data: { status: "completed", processedAt: new Date() },
          });
        }
        processed += 1;
        continue;
      }

      if (job.jobKey === "day3") {
        if (!firstOut) {
          await prisma.leadFollowUpJob.update({
            where: { id: job.id },
            data: { status: "skipped", processedAt: new Date() },
          });
        } else {
          const replied = await hasInboundAfter(lead.id, firstOut.createdAt);
          if (!replied) {
            const ok = await sendSmsTemplate(lead.id, "missed_call_follow_up", locale);
            if (ok) await appendLeadTimeline(lead.id, "follow_up_day3_sent", {});
          }
          await prisma.leadFollowUpJob.update({
            where: { id: job.id },
            data: { status: "completed", processedAt: new Date() },
          });
        }
        processed += 1;
        continue;
      }

      if (job.jobKey === CRM_JOB_BNHUB_BOOKING_THANKS_EMAIL) {
        const sent = await sendBnhubBookingThanksEmail(lead.id);
        await appendLeadTimeline(lead.id, sent ? "bnhub_booking_thanks_email_sent" : "bnhub_booking_thanks_email_skipped", {
          jobId: job.id,
        });
        await prisma.leadFollowUpJob.update({
          where: { id: job.id },
          data: { status: "completed", processedAt: new Date() },
        });
        processed += 1;
        continue;
      }

      if (job.jobKey === EMAIL_2_KEY || job.jobKey === EMAIL_3_KEY) {
        try {
          const templateId = job.jobKey === EMAIL_2_KEY ? "evaluation_followup_2" : "evaluation_followup_3";
          await sendAutomatedEvaluationEmail(lead.id, templateId);
        } catch (e) {
          await prisma.leadFollowUpJob.update({
            where: { id: job.id },
            data: {
              status: "failed",
              lastError: e instanceof Error ? e.message : "email_error",
              processedAt: new Date(),
            },
          });
          processed += 1;
          continue;
        }
        await prisma.leadFollowUpJob.update({
          where: { id: job.id },
          data: { status: "completed", processedAt: new Date() },
        });
        processed += 1;
        continue;
      }

      await prisma.leadFollowUpJob.update({
        where: { id: job.id },
        data: { status: "skipped", processedAt: new Date(), lastError: "unknown_job_key" },
      });
      processed += 1;
    } catch (e) {
      await prisma.leadFollowUpJob.update({
        where: { id: job.id },
        data: {
          status: "failed",
          lastError: e instanceof Error ? e.message : "error",
          processedAt: new Date(),
        },
      });
      processed += 1;
    }
  }

  return { processed };
}

/** Inbound SMS (Twilio): store, opt-out, safety escalation */
export async function handleInboundSms(params: { from: string; body: string; externalId?: string }): Promise<void> {
  const e164 = normalizeToE164(params.from);
  if (!e164) return;
  const digits = params.from.replace(/\D/g, "");
  const lead = await prisma.lead.findFirst({
    where: {
      OR: [{ phone: { contains: digits.slice(-10) } }, { phone: { contains: params.from } }],
    },
    orderBy: { createdAt: "desc" },
  });
  if (!lead) {
    console.info("[InboundSMS] No lead match for", params.from);
    return;
  }

  await prisma.leadCommMessage.create({
    data: {
      leadId: lead.id,
      direction: "inbound",
      channel: "sms",
      body: params.body,
      status: "received",
      externalId: params.externalId,
    },
  });
  await appendLeadTimeline(lead.id, "sms_reply_received", { preview: params.body.slice(0, 200) });

  const low = params.body.trim().toLowerCase();
  if (/^(stop|unsubscribe|arr[eê]t|cancel)$/i.test(low)) {
    await prisma.lead.update({
      where: { id: lead.id },
      data: { optedOutOfFollowUp: true, pipelineStatus: "lost" },
    });
    await appendLeadTimeline(lead.id, "opt_out_sms", {});
    return;
  }

  const safety = classifyInboundSafety(params.body);
  if (safety) {
    await escalateLeadToBroker({
      leadId: lead.id,
      reason: `inbound_safety:${safety}`,
      brokerId: lead.introducedByBrokerId,
      summary: { inboundPreview: params.body.slice(0, 500) },
    });
    if (isTwilioSmsConfigured()) {
      await sendTwilioSms({ toE164: normalizeToE164(lead.phone) ?? e164, body: SAFETY_REPLY });
    }
  }
}
