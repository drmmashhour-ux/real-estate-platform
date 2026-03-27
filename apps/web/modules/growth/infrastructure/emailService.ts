import { Prisma } from "@prisma/client";
import { sendEmail } from "@/lib/email/send";
import { captureServerEvent } from "@/lib/analytics/posthog-server";
import { AnalyticsEvents } from "@/lib/analytics/events";
import { prisma } from "@/lib/db";
import type { GrowthTriggerKeyType } from "../domain/growthRules";

export type SendGrowthEmailResult = { ok: true; skipped?: boolean } | { ok: false; error: string };

/**
 * Plain-text-first growth email. Persists an idempotent row before sending to avoid duplicate sends.
 */
export async function sendGrowthPlainEmail(args: {
  userId: string;
  to: string;
  triggerKey: GrowthTriggerKeyType;
  idempotencyKey: string;
  subject: string;
  body: string;
}): Promise<SendGrowthEmailResult> {
  try {
    await prisma.growthEmailLog.create({
      data: {
        userId: args.userId,
        triggerKey: args.triggerKey,
        idempotencyKey: args.idempotencyKey,
        subject: args.subject,
        bodyPreview: args.body.slice(0, 500),
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: true, skipped: true };
    }
    return { ok: false, error: e instanceof Error ? e.message : "create log failed" };
  }

  await sendEmail({
    to: args.to,
    subject: args.subject,
    html: `<pre style="font-family:system-ui,sans-serif;white-space:pre-wrap;">${escapeHtml(args.body)}</pre>`,
    type: "deal_update",
  });

  captureServerEvent(args.userId, AnalyticsEvents.EMAIL_SENT, { type: args.triggerKey });
  captureServerEvent(args.userId, AnalyticsEvents.RETENTION_TRIGGER_FIRED, { trigger: args.triggerKey });

  return { ok: true };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
