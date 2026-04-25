import { prisma } from "@/lib/db";
import { normalizeToE164 } from "@/modules/messaging/services/phone-normalize";
import { sendTwilioSms, isTwilioSmsConfigured } from "@/modules/messaging/services/twilio-sms";
import { isWhatsAppConfigured, sendWhatsAppText } from "@/modules/messaging/services/whatsapp-stub";
import { getFollowUpSettings } from "./settings";
import { appendLeadTimeline } from "./timeline";
import { recordLeadConsent } from "./consent";
import { detectLocaleFromHint, renderFollowUpTemplate, type FollowUpLocale, type TemplateKey } from "./templates";
import { LEAD_PIPELINE } from "./pipeline";
import { tierFromScore } from "@/lib/ai/lead-tier";
import { logAiEvent } from "@/lib/ai/log";

async function loadListingMeta(listingId: string | null | undefined) {
  if (!listingId) return { title: null as string | null, city: null as string | null };
  const st = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: { title: true, city: true },
  });
  if (st) return { title: st.title, city: st.city };
  const crm = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { title: true },
  });
  if (crm) return { title: crm.title, city: null };
  return { title: null, city: null };
}

async function outboundMessage(params: {
  leadId: string;
  channel: "sms" | "whatsapp";
  templateKey: TemplateKey;
  body: string;
  locale: FollowUpLocale;
  status: string;
  externalId?: string;
}) {
  await prisma.leadCommMessage.create({
    data: {
      leadId: params.leadId,
      direction: "outbound",
      channel: params.channel,
      templateKey: params.templateKey,
      body: params.body,
      status: params.status,
      locale: params.locale,
      externalId: params.externalId,
    },
  });
}

export async function hasInboundAfter(leadId: string, after: Date): Promise<boolean> {
  const n = await prisma.leadCommMessage.count({
    where: { leadId, direction: "inbound", createdAt: { gte: after } },
  });
  return n > 0;
}

async function sendFirstTouchMessage(params: {
  leadId: string;
  phone: string;
  locale: FollowUpLocale;
  listingTitle: string | null;
  city: string | null;
  leadName: string;
}): Promise<{ channel: "sms" | "whatsapp" | "none"; ok: boolean }> {
  const settings = await getFollowUpSettings();
  const leadRow = await prisma.lead.findUniqueOrThrow({ where: { id: params.leadId } });
  const e164 = normalizeToE164(params.phone);
  if (!e164) return { channel: "none", ok: false };

  const disclosure = renderFollowUpTemplate("assistant_disclosure_sms", params.locale, leadRow, {
    listingTitle: params.listingTitle,
    city: params.city,
  });
  const main = renderFollowUpTemplate("immediate_response", params.locale, leadRow, {
    listingTitle: params.listingTitle,
    city: params.city,
  });
  const body = `${disclosure}\n\n${main}`.slice(0, 1500);

  if (settings.enableWhatsapp && isWhatsAppConfigured()) {
    const r = await sendWhatsAppText({ toE164: e164, body });
    if (r.ok) {
      await outboundMessage({
        leadId: params.leadId,
        channel: "whatsapp",
        templateKey: "immediate_response",
        body,
        locale: params.locale,
        status: "sent",
        externalId: r.id,
      });
      return { channel: "whatsapp", ok: true };
    }
  }

  if (settings.enableSms && isTwilioSmsConfigured()) {
    const r = await sendTwilioSms({ toE164: e164, body });
    await outboundMessage({
      leadId: params.leadId,
      channel: "sms",
      templateKey: "immediate_response",
      body,
      locale: params.locale,
      status: r.ok ? "sent" : "failed",
      externalId: r.sid,
    });
    if (!r.ok) {
      await appendLeadTimeline(params.leadId, "sms_send_failed", { error: r.error });
    }
    return { channel: "sms", ok: r.ok };
  }

  // Dev / no provider: log as internal record so CRM shows intent
  await outboundMessage({
    leadId: params.leadId,
    channel: "sms",
    templateKey: "immediate_response",
    body: `[NOT_SENT_NO_PROVIDER]\n${body}`,
    locale: params.locale,
    status: "failed",
  });
  await appendLeadTimeline(params.leadId, "sms_skipped_no_provider", {});
  return { channel: "none", ok: false };
}

async function scheduleJobs(leadId: string): Promise<void> {
  const s = await getFollowUpSettings();
  const now = Date.now();
  const jobs: { jobKey: string; scheduledFor: Date }[] = [
    { jobKey: "nudge_30m", scheduledFor: new Date(now + s.minutesToSecondTouch * 60 * 1000) },
    { jobKey: "day1", scheduledFor: new Date(now + s.hoursToDayOneTouch * 60 * 60 * 1000) },
    { jobKey: "day3", scheduledFor: new Date(now + s.daysToFinalTouch * 24 * 60 * 60 * 1000) },
  ];
  for (const j of jobs) {
    await prisma.leadFollowUpJob.deleteMany({
      where: { leadId, jobKey: j.jobKey, status: "pending" },
    });
    await prisma.leadFollowUpJob.create({
      data: { leadId, jobKey: j.jobKey, scheduledFor: j.scheduledFor, status: "pending" },
    });
  }
  logAiEvent("follow_up_job_scheduled", { leadId, jobs: jobs.map((x) => x.jobKey) });
}

async function scheduleVoiceJob(leadId: string): Promise<void> {
  const s = await getFollowUpSettings();
  if (!s.enableVoice) return;
  const when = new Date(Date.now() + s.voiceDelayMinutes * 60 * 1000);
  await prisma.leadFollowUpJob.deleteMany({
    where: { leadId, jobKey: "voice_hot", status: "pending" },
  });
  await prisma.leadFollowUpJob.create({
    data: { leadId, jobKey: "voice_hot", scheduledFor: when, status: "pending" },
  });
}

/**
 * Call after Lead row is persisted. Idempotent enough for duplicate calls (guards on messages).
 */
export async function triggerAiFollowUpForLead(params: {
  leadId: string;
  source: string;
  phone?: string | null;
  score: number;
  aiTier?: string | null;
  listingId?: string | null;
  introducedByBrokerId?: string | null;
  consent?: { smsWhatsapp: boolean; voice: boolean; locale?: string | null } | null;
  requestMeta?: { sourcePage?: string | null; ip?: string | null; userAgent?: string | null };
}): Promise<void> {
  const settings = await getFollowUpSettings();
  const lead = await prisma.lead.findUnique({ where: { id: params.leadId } });
  if (!lead || lead.optedOutOfFollowUp) return;

  const { title, city } = await loadListingMeta(params.listingId ?? lead.listingId);
  const locale = detectLocaleFromHint(params.consent?.locale ?? undefined);

  await appendLeadTimeline(params.leadId, "lead_capture", {
    source: params.source,
    score: params.score,
    aiTier: params.aiTier,
  });

  if (params.consent) {
    await recordLeadConsent({
      leadId: params.leadId,
      consentSmsWhatsapp: params.consent.smsWhatsapp,
      consentVoice: params.consent.voice,
      locale: params.consent.locale,
      sourcePage: params.requestMeta?.sourcePage,
      ip: params.requestMeta?.ip,
      userAgent: params.requestMeta?.userAgent,
    });
    await appendLeadTimeline(params.leadId, "consent_recorded", {
      smsWhatsapp: params.consent.smsWhatsapp,
      voice: params.consent.voice,
    });
  }

  const tier = params.aiTier ?? tierFromScore(params.score);
  const require = settings.requireExplicitConsent;
  const phone = (params.phone ?? lead.phone ?? "").trim();
  const allowInstant =
    Boolean(phone) &&
    (!require || params.consent?.smsWhatsapp === true) &&
    (settings.enableSms || settings.enableWhatsapp);

  const alreadySent = await prisma.leadCommMessage.findFirst({
    where: { leadId: params.leadId, templateKey: "immediate_response", direction: "outbound" },
  });

  if (allowInstant && !alreadySent) {
    const sent = await sendFirstTouchMessage({
      leadId: params.leadId,
      phone,
      locale,
      listingTitle: title,
      city,
      leadName: lead.name,
    });
    if (sent.ok) {
      await prisma.lead.update({
        where: { id: params.leadId },
        data: { pipelineStatus: LEAD_PIPELINE.CONTACTED },
      });
      await appendLeadTimeline(params.leadId, "first_sms_sent", { channel: sent.channel });
      logAiEvent("follow_up_sent", { leadId: params.leadId, channel: sent.channel, template: "immediate_response" });
    }
  } else {
    await appendLeadTimeline(params.leadId, "instant_message_skipped", {
      reason: !phone ? "no_phone" : require && !params.consent?.smsWhatsapp ? "consent_required" : "channels_disabled",
    });
  }

  await scheduleJobs(params.leadId);

  if (tier === "hot" || params.score >= settings.hotScoreThreshold) {
    await appendLeadTimeline(params.leadId, "hot_lead_automation_armed", {
      score: params.score,
      tier,
    });
    if (params.consent?.voice && settings.enableVoice) {
      await scheduleVoiceJob(params.leadId);
    }
  }
}
