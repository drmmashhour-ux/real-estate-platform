/**
 * Platform notification helpers — dashboard (in-app) + email.
 */

import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email/resend";

export type DashboardNotificationPayload = {
  mortgageExpertId: string;
  kind?: string;
  leadId?: string | null;
  title: string;
  body?: string | null;
};

/**
 * Persist an in-app notification for the mortgage expert (bell + unread count).
 */
export async function sendDashboardNotification(payload: DashboardNotificationPayload): Promise<void> {
  try {
    await prisma.expertInAppNotification.create({
      data: {
        expertId: payload.mortgageExpertId,
        leadId: payload.leadId ?? null,
        kind: payload.kind ?? "mortgage_lead",
        title: payload.title.slice(0, 200),
        body: payload.body?.slice(0, 4000) ?? null,
      },
    });
  } catch (e) {
    console.warn("[notifications] sendDashboardNotification failed:", e);
  }
}

export type EmailNotificationPayload = {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
};

/**
 * Send transactional email (Resend when configured).
 */
export async function sendEmailNotification(payload: EmailNotificationPayload): Promise<boolean> {
  return sendEmail({
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    replyTo: payload.replyTo,
  });
}
