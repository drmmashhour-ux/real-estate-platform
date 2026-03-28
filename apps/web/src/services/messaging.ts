import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email/resend";
import { logError, logInfo } from "@/lib/logger";
import { resolveObjectionTemplateType } from "@/src/modules/messaging/objections";

const MS_24H = 24 * 60 * 60 * 1000;

export function isMessagingAutomationEnabled(): boolean {
  return process.env.MESSAGING_AUTOMATION_ENABLED === "1";
}

export function personalize(template: string, vars: Record<string, string>): string {
  let out = template;
  for (const [key, value] of Object.entries(vars)) {
    out = out.split(`{{${key}}}`).join(value);
  }
  return out;
}

export async function getTemplate(segment: string, type: string) {
  return prisma.messageTemplate.findFirst({
    where: { segment, type },
    orderBy: { createdAt: "desc" },
  });
}

export async function countUserMessagesInLast24h(userId: string): Promise<number> {
  return prisma.messageLog.count({
    where: { userId, sentAt: { gte: new Date(Date.now() - MS_24H) } },
  });
}

export type SendTemplatedMessageOptions = {
  triggerEvent?: string;
  adminOverride?: boolean;
  skipRateLimit?: boolean;
  /** Single scheduled follow-up after 24h (allowed even if a prior send exists in window). */
  scheduledFollowUp?: boolean;
};

/**
 * Send one templated email and log it. Enforces max 1 automated send / 24h unless override.
 */
export async function sendTemplatedUserMessage(
  userId: string,
  segment: string,
  type: string,
  vars: Record<string, string>,
  opts: SendTemplatedMessageOptions = {}
): Promise<{ ok: boolean; error?: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      name: true,
      growthMessagingPaused: true,
    },
  });
  if (!user?.email) return { ok: false, error: "No email" };
  if (user.growthMessagingPaused && !opts.skipRateLimit && !opts.adminOverride) {
    return { ok: false, error: "Messaging paused" };
  }

  if (!opts.skipRateLimit && !opts.adminOverride && !opts.scheduledFollowUp) {
    const n = await countUserMessagesInLast24h(userId);
    if (n >= 1) return { ok: false, error: "Rate limit: 1 / 24h" };
  }

  const tpl = await getTemplate(segment, type);
  if (!tpl) return { ok: false, error: `No template ${segment}/${type}` };

  const subj = tpl.subject ? personalize(tpl.subject, vars) : "LECIPM";
  const html = `<div style="font-family:system-ui,sans-serif;line-height:1.5">${personalize(tpl.content, vars).replace(/\n/g, "<br/>")}</div>`;

  const okSend = await sendEmail({ to: user.email, subject: subj, html });
  if (!okSend) {
    logError("messaging email send failed", { userId, type });
    return { ok: false, error: "Send failed" };
  }

  const preview = personalize(tpl.content, vars).slice(0, 280);
  await prisma.messageLog.create({
    data: {
      userId,
      templateId: tpl.id,
      channel: "email",
      status: "sent",
      subject: subj,
      bodyPreview: preview,
      triggerEvent: opts.triggerEvent ?? null,
      metadata: opts.adminOverride ? { admin_override: true } : undefined,
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: {
      growthLastContactAt: new Date(),
      growthOutreachSegment: segment,
    },
  });

  logInfo("[messaging] sent", { userId, segment, type, trigger: opts.triggerEvent });
  return { ok: true };
}

export async function scheduleFollowUp(userId: string, hoursFromNow = 24): Promise<void> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { growthFollowUpSentAt: true, growthMessagingPaused: true },
  });
  if (!u || u.growthMessagingPaused || u.growthFollowUpSentAt) return;

  await prisma.user.update({
    where: { id: userId },
    data: {
      growthFollowUpDueAt: new Date(Date.now() + hoursFromNow * 60 * 60 * 1000),
    },
  });
}

/** Call when inbound reply detected (manual or future integration). */
export async function pauseAutomatedMessagingForUser(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      growthMessagingPaused: true,
      growthFollowUpDueAt: null,
    },
  });
}

export async function markMessageLogReplied(userId: string): Promise<void> {
  await prisma.messageLog.updateMany({
    where: { userId, status: "sent" },
    data: { status: "replied" },
  });
  await pauseAutomatedMessagingForUser(userId);
}

/** Keyword → objection template (does not send if no match). */
export async function sendObjectionReplyEmail(
  userId: string,
  inboundText: string,
  vars: Record<string, string>
): Promise<{ ok: boolean; templateType?: string; error?: string }> {
  const type = resolveObjectionTemplateType(inboundText);
  if (!type) return { ok: false, error: "No objection match" };
  const r = await sendTemplatedUserMessage(userId, "warm", type, vars, { triggerEvent: "objection_reply" });
  return r.ok ? { ok: true, templateType: type } : { ok: false, templateType: type, error: r.error };
}
