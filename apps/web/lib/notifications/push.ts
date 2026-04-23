import type { Prisma } from "@prisma/client";
import webpush from "web-push";
import { prisma } from "@/lib/db";

const vapidConfigured = Boolean(process.env.VAPID_PUBLIC?.trim() && process.env.VAPID_PRIVATE?.trim());

export function isWebPushConfigured(): boolean {
  return vapidConfigured;
}

if (vapidConfigured) {
  webpush.setVapidDetails(
    "mailto:admin@lecipm.com",
    process.env.VAPID_PUBLIC!,
    process.env.VAPID_PRIVATE!,
  );
}

export async function sendPushNotification(
  ownerType: string,
  ownerId: string,
  payload: { title: string; body: string },
  alertId?: string | null,
): Promise<void> {
  if (!vapidConfigured) return;

  const subs = await prisma.pushSubscription.findMany({
    where: { ownerType, ownerId },
  });

  for (const sub of subs) {
    const keysRaw = sub.keys as { p256dh?: string; auth?: string };
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: keysRaw.p256dh ?? "",
            auth: keysRaw.auth ?? "",
          },
        },
        JSON.stringify(payload),
      );
      await prisma.notificationLog.create({
        data: {
          ownerType,
          ownerId,
          channel: "push",
          status: "sent",
          alertId: alertId ?? undefined,
          title: payload.title,
          message: payload.body,
          providerResponse: { endpoint: sub.endpoint } as Prisma.InputJsonValue,
        },
      });
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : String(e);
      await prisma.notificationLog.create({
        data: {
          ownerType,
          ownerId,
          channel: "push",
          status: "failed",
          alertId: alertId ?? undefined,
          title: payload.title,
          message: payload.body,
          providerResponse: { error: errMsg, endpoint: sub.endpoint } as Prisma.InputJsonValue,
        },
      });
    }
  }
}
