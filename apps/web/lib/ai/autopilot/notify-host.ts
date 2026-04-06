import { NotificationPriority, NotificationType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { normalizeLocaleCode, translateServer } from "@/lib/i18n/server-translate";

export async function notifyHostAutopilot(input: {
  userId: string;
  title: string;
  message: string;
  /** When set, notification action label follows UI language. Title/message should already be localized by callers when needed. */
  locale?: string | null;
  actionUrl?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  let loc = normalizeLocaleCode(input.locale ?? undefined);
  if (input.locale === undefined) {
    const u = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { preferredUiLocale: true },
    });
    loc = normalizeLocaleCode(u?.preferredUiLocale);
  }
  const actionLabel = translateServer(loc, "notifications.openAutopilot");
  try {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        type: NotificationType.SYSTEM,
        title: input.title,
        message: input.message,
        priority: NotificationPriority.NORMAL,
        actionUrl: input.actionUrl ?? "/dashboard/host/autopilot",
        actionLabel,
        metadata: (input.metadata ?? {}) as object,
      },
    });
  } catch {
    /* non-fatal */
  }

  try {
    await prisma.managerAiNotificationLog.create({
      data: {
        userId: input.userId,
        channel: "in_app",
        type: "host_autopilot",
        payload: { title: input.title, message: input.message, ...input.metadata } as object,
        status: "sent",
      },
    });
  } catch {
    /* non-fatal */
  }
}
