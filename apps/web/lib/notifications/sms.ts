import twilio from "twilio";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export type SendSMSNotificationInput = {
  ownerType: string;
  ownerId: string;
  to: string;
  message: string;
  alertId?: string | null;
};

function getTwilioClient(): ReturnType<typeof twilio> | null {
  const sid = process.env.TWILIO_SID?.trim();
  const token = process.env.TWILIO_TOKEN?.trim();
  if (!sid || !token) return null;
  return twilio(sid, token);
}

function withSmsComplianceFooter(body: string): string {
  const trimmed = body.trim();
  if (/reply\s+stop/i.test(trimmed)) return trimmed;
  return `${trimmed}\n\nReply STOP to opt out.`;
}

export async function sendSMSNotification(input: SendSMSNotificationInput): Promise<boolean> {
  const { ownerType, ownerId, to, message, alertId } = input;
  const title = "SMS Alert";
  const body = withSmsComplianceFooter(message);
  const from = process.env.TWILIO_PHONE?.trim();

  try {
    const client = getTwilioClient();
    if (!client || !from) {
      throw new Error("TWILIO_NOT_CONFIGURED");
    }

    const res = await client.messages.create({
      body,
      from,
      to,
    });

    await prisma.notificationLog.create({
      data: {
        ownerType,
        ownerId,
        channel: "sms",
        status: "sent",
        alertId: alertId ?? undefined,
        title,
        message: body,
        providerResponse: {
          sid: res.sid,
          status: res.status,
          to: res.to,
        } as Prisma.InputJsonValue,
      },
    });
    return true;
  } catch (e: unknown) {
    const errMsg = e instanceof Error ? e.message : String(e);
    await prisma.notificationLog.create({
      data: {
        ownerType,
        ownerId,
        channel: "sms",
        status: "failed",
        alertId: alertId ?? undefined,
        title,
        message: body,
        providerResponse: { error: errMsg } as Prisma.InputJsonValue,
      },
    });
    return false;
  }
}
