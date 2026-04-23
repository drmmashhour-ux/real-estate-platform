import nodemailer from "nodemailer";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { sendEmail as sendViaResend } from "@/lib/email/resend";

export type SendEmailNotificationInput = {
  ownerType: string;
  ownerId: string;
  to: string;
  title: string;
  message: string;
  alertId?: string | null;
};

function smtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_USER?.trim() &&
      process.env.SMTP_PASS?.trim(),
  );
}

function buildUnsubscribeFooterHtml(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ?? "";
  const settingsPath = "/dashboard/broker/settings/notifications";
  const href = base ? `${base}${settingsPath}` : settingsPath;
  return `<p style="font-size:12px;color:#666;margin-top:24px"><a href="${href}">Manage notifications / unsubscribe</a></p>`;
}

function buildHtmlBody(message: string): string {
  const escaped = message.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>");
  return `<p>${escaped}</p>${buildUnsubscribeFooterHtml()}`;
}

async function sendWithSmtp(to: string, subject: string, text: string, html: string): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  const from = process.env.SMTP_FROM?.trim() || "alerts@lecipm.com";
  await transporter.sendMail({
    from,
    to,
    subject,
    text: `${messagePlainFromHtml(text)}\n\nManage: ${process.env.NEXT_PUBLIC_APP_URL ?? ""}/dashboard/broker/settings/notifications`,
    html,
  });
}

export async function sendEmailNotification(input: SendEmailNotificationInput): Promise<boolean> {
  const { ownerType, ownerId, to, title, message, alertId } = input;
  const html = buildHtmlBody(message);

  try {
    if (smtpConfigured()) {
      await sendWithSmtp(to, title, message, html);
    } else {
      const ok = await sendViaResend({
        to,
        subject: title,
        html,
      });
      if (!ok) {
        throw new Error("RESEND_SEND_FAILED_OR_NOT_CONFIGURED");
      }
    }

    await prisma.notificationLog.create({
      data: {
        ownerType,
        ownerId,
        channel: "email",
        status: "sent",
        alertId: alertId ?? undefined,
        title,
        message,
        providerResponse: { provider: smtpConfigured() ? "smtp" : "resend" } as Prisma.InputJsonValue,
      },
    });
    return true;
  } catch (e: unknown) {
    const errMsg = e instanceof Error ? e.message : String(e);
    await prisma.notificationLog.create({
      data: {
        ownerType,
        ownerId,
        channel: "email",
        status: "failed",
        alertId: alertId ?? undefined,
        title,
        message,
        providerResponse: { error: errMsg } as Prisma.InputJsonValue,
      },
    });
    return false;
  }
}
