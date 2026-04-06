import { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { sendEmailNotification } from "@/lib/notifications";

export async function notifyHostInAppAndEmail(opts: {
  ownerId: string;
  ownerEmail: string | null;
  listingId: string;
  title: string;
  message: string;
  actionUrl: string;
  actionLabel: string;
  emailSubject: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: opts.ownerId,
        type: NotificationType.SYSTEM,
        title: opts.title.slice(0, 200),
        message: opts.message.slice(0, 8000),
        listingId: opts.listingId,
        actionUrl: opts.actionUrl,
        actionLabel: opts.actionLabel,
        metadata: (opts.metadata ?? { kind: "bnhub_listing" }) as object,
      },
    });
  } catch (e) {
    console.warn("[bnhub] notifyHostInApp failed:", e);
  }

  if (opts.ownerEmail?.includes("@")) {
    const safe = opts.message
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    const html = `<pre style="font-family:system-ui,sans-serif;white-space:pre-wrap;line-height:1.5">${safe}</pre>`;
    try {
      await sendEmailNotification({
        to: opts.ownerEmail,
        subject: opts.emailSubject.slice(0, 200),
        html,
      });
    } catch (e) {
      console.warn("[bnhub] notifyHost email failed:", e);
    }
  }
}
