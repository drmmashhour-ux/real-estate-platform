import { NotificationPriority, NotificationType, PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { createBnhubMobileNotification } from "@/lib/bnhub/mobile-push";

/** Push + in-app notification for active admin users (BNHub mobile / bell). */
export async function notifyActiveAdmins(input: {
  title: string;
  message: string;
  actionUrl?: string | null;
}) {
  const admins = await prisma.user.findMany({
    where: { role: PlatformRole.ADMIN, accountStatus: "ACTIVE" },
    select: { id: true },
    take: 80,
  });
  for (const a of admins) {
    void createBnhubMobileNotification({
      userId: a.id,
      title: input.title,
      message: input.message,
      type: NotificationType.SYSTEM,
      priority: NotificationPriority.HIGH,
      actionUrl: input.actionUrl ?? null,
      actionLabel: "Review",
    }).catch(() => {});
  }
}
