/**
 * Expo Push API — sends to tokens stored in `MobileDeviceToken` for platform admins.
 * https://docs.expo.dev/push-notifications/sending-notifications/
 */
import { PlatformRole } from "@prisma/client";

import { prisma } from "@/lib/db";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

export async function sendExpoPushMessages(messages: ExpoPushMessage[]): Promise<boolean> {
  if (messages.length === 0) return true;
  const chunks: ExpoPushMessage[][] = [];
  for (let i = 0; i < messages.length; i += 90) {
    chunks.push(messages.slice(i, i + 90));
  }
  let allOk = true;
  for (const chunk of chunks) {
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: chunk.map((m) => ({
            to: m.to,
            sound: "default",
            title: m.title,
            body: m.body,
            data: m.data ?? {},
          })),
        }),
      });
      if (!res.ok) {
        console.error("[expo-push] HTTP", res.status, await res.text());
        allOk = false;
      }
    } catch (e) {
      console.error("[expo-push] fetch failed", e);
      allOk = false;
    }
  }
  return allOk;
}

/** Push plain admin alert copy to every active Expo token owned by users with ADMIN role. */
/** Push to specific Prisma user ids (any role) — e.g. Soins family viewers. */
export async function sendExpoPushToUserIds(
  userIds: string[],
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<boolean> {
  const uniqueIds = [...new Set(userIds)].filter(Boolean);
  if (uniqueIds.length === 0) return true;

  const rows = await prisma.mobileDeviceToken.findMany({
    where: { userId: { in: uniqueIds }, revokedAt: null },
    select: { token: true },
  });
  const unique = [...new Set(rows.map((r) => r.token))];
  if (unique.length === 0) return true;

  const smsBody = body.length > 360 ? `${body.slice(0, 340)}…` : body;
  const shortTitle = title.length > 80 ? `${title.slice(0, 77)}…` : title;

  return sendExpoPushMessages(unique.map((to) => ({ to, title: shortTitle, body: smsBody, data })));
}

export async function sendExpoPushToAdminUsers(title: string, body: string): Promise<boolean> {
  const admins = await prisma.user.findMany({
    where: { role: PlatformRole.ADMIN },
    select: { id: true },
  });
  const adminIds = admins.map((a) => a.id);
  if (adminIds.length === 0) return true;

  const rows = await prisma.mobileDeviceToken.findMany({
    where: { userId: { in: adminIds }, revokedAt: null },
    select: { token: true },
  });
  const unique = [...new Set(rows.map((r) => r.token))];
  if (unique.length === 0) return true;

  const smsBody = body.length > 360 ? `${body.slice(0, 340)}…` : body;
  const shortTitle = title.length > 80 ? `${title.slice(0, 77)}…` : title;

  return sendExpoPushMessages(unique.map((to) => ({ to, title: shortTitle, body: smsBody })));
}

export async function sendPushNotification(token: string, title: string, body: string): Promise<boolean> {
  return sendExpoPushMessages([{ to: token, title, body }]);
}
