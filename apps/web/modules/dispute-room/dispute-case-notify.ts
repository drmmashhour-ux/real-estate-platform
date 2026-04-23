import { prisma } from "@/lib/db";

function disputeUrl(disputeId: string): string {
  return `/dashboard/disputes/${disputeId}`;
}

export async function notifyDisputeEvent(params: {
  disputeId: string;
  title: string;
  message: string;
  recipientUserIds: string[];
  actorUserId?: string | null;
  priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
}): Promise<void> {
  const recipients = [...new Set(params.recipientUserIds)].filter(
    (id) => id && id !== params.actorUserId
  );
  if (recipients.length === 0) return;

  await prisma.$transaction(
    recipients.map((userId) =>
      prisma.notification.create({
        data: {
          userId,
          type: "DISPUTE_CASE",
          title: params.title,
          message: params.message,
          priority: params.priority ?? "NORMAL",
          actionUrl: disputeUrl(params.disputeId),
          actionLabel: "View dispute",
          metadata: {
            channel: "lecipm_dispute_case",
            disputeId: params.disputeId,
          } as object,
          actorId: params.actorUserId ?? undefined,
        },
      })
    )
  );
}
