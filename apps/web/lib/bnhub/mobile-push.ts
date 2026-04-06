import { NotificationPriority, NotificationType, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logError, logInfo, logWarn } from "@/lib/logger";

type PushData = Record<string, string | number | boolean | null>;

function isExpoPushToken(token: string) {
  return token.startsWith("ExponentPushToken[") || token.startsWith("ExpoPushToken[");
}

export async function sendBnhubPushToUser(input: {
  userId: string;
  title: string;
  body: string;
  data?: PushData;
}) {
  const tokens = await prisma.mobileDeviceToken.findMany({
    where: {
      userId: input.userId,
      revokedAt: null,
      provider: "expo",
    },
    select: {
      id: true,
      token: true,
    },
  });

  const validTokens = tokens.filter((row) => isExpoPushToken(row.token));
  if (validTokens.length === 0) {
    return { sent: 0, revoked: 0 };
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const accessToken = process.env.EXPO_ACCESS_TOKEN?.trim();
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const payload = validTokens.map((row) => ({
    to: row.token,
    title: input.title,
    body: input.body,
    sound: "default",
    data: input.data ?? {},
  }));

  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      logWarn("BNHub mobile push request failed", {
        status: response.status,
        userId: input.userId,
      });
      return { sent: 0, revoked: 0 };
    }

    const result = (await response.json().catch(() => null)) as
      | { data?: Array<{ status?: string; details?: { error?: string } }> }
      | null;

    const rowsToRevoke: string[] = [];
    for (let index = 0; index < validTokens.length; index += 1) {
      const receipt = result?.data?.[index];
      if (receipt?.details?.error === "DeviceNotRegistered") {
        rowsToRevoke.push(validTokens[index].id);
      }
    }

    if (rowsToRevoke.length > 0) {
      await prisma.mobileDeviceToken.updateMany({
        where: { id: { in: rowsToRevoke } },
        data: { revokedAt: new Date() },
      });
    }

    logInfo("BNHub mobile push dispatched", {
      userId: input.userId,
      tokenCount: validTokens.length,
      revokedCount: rowsToRevoke.length,
    });

    return { sent: validTokens.length, revoked: rowsToRevoke.length };
  } catch (error) {
    logError("BNHub mobile push dispatch crashed", error);
    return { sent: 0, revoked: 0 };
  }
}

export async function createBnhubMobileNotification(input: {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  priority?: NotificationPriority;
  actionUrl?: string | null;
  actionLabel?: string | null;
  actorId?: string | null;
  listingId?: string | null;
  metadata?: Prisma.InputJsonValue;
  pushData?: PushData;
}) {
  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type ?? NotificationType.SYSTEM,
      title: input.title,
      message: input.message,
      priority: input.priority ?? NotificationPriority.NORMAL,
      actionUrl: input.actionUrl ?? null,
      actionLabel: input.actionLabel ?? null,
      actorId: input.actorId ?? null,
      listingId: input.listingId ?? null,
      metadata: input.metadata,
    },
  });

  await sendBnhubPushToUser({
    userId: input.userId,
    title: input.title,
    body: input.message,
    data: {
      notificationId: notification.id,
      actionUrl: input.actionUrl ?? "",
      ...(input.pushData ?? {}),
    },
  });

  return notification;
}
