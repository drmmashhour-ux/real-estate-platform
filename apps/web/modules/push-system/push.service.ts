import { NotificationPriority, NotificationType, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { sendBnhubPushToUser } from "@/lib/bnhub/mobile-push";
import { getBrokerPushPreferences } from "./push-preference.service";
import { assertPushRateOk } from "./push-rate-limit.service";
import type { BrokerPushCategory } from "./push.types";
import { templateForCategory } from "./push-template.service";

/**
 * Creates in-app notification + optional Expo push for broker mobile.
 * Respects category prefs + privacy (minimized body on lock screen via client; server stores full message in DB for inbox).
 */
export async function notifyBrokerMobile(input: {
  userId: string;
  category: BrokerPushCategory;
  title?: string;
  body?: string;
  dealId?: string | null;
  metadata?: Prisma.InputJsonValue;
  priority?: NotificationPriority;
}): Promise<{ notificationId: string; pushSent: number }> {
  const prefs = await getBrokerPushPreferences(input.userId);
  if (prefs.categories[input.category] === false) {
    return { notificationId: "", pushSent: 0 };
  }

  const rate = await assertPushRateOk(input.userId);
  if (!rate.ok) {
    return { notificationId: "", pushSent: 0 };
  }

  const tpl = templateForCategory(input.category, {});
  const title = input.title ?? tpl.title;
  let message = input.body ?? tpl.body;
  if (prefs.privacyMinimizeLockScreen) {
    message = "Open LECIPM to view details.";
  }

  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: NotificationType.SYSTEM,
      title,
      message,
      priority: input.priority ?? NotificationPriority.HIGH,
      metadata: {
        brokerMobile: true,
        category: input.category,
        ...(input.metadata && typeof input.metadata === "object" ? (input.metadata as object) : {}),
      },
    },
  });

  const { sent } = await sendBnhubPushToUser({
    userId: input.userId,
    title,
    body: message,
    data: {
      brokerMobile: "1",
      category: input.category,
      notificationId: notification.id,
      dealId: input.dealId ?? "",
    },
  });

  return { notificationId: notification.id, pushSent: sent };
}
