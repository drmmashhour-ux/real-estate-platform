import { prisma } from "@/lib/db";

const ALLOWED_TEMPLATE_FAMILIES = new Set(["operational_nudge", "booking_reminder", "listing_completion"]);

export type CommunicationsQueueInput = {
  userId: string;
  templateFamily: string;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
};

export async function queueTemplateCommunication(input: CommunicationsQueueInput): Promise<{ ok: boolean; id?: string }> {
  if (!ALLOWED_TEMPLATE_FAMILIES.has(input.templateFamily)) {
    return { ok: false };
  }
  const row = await prisma.managerAiNotificationLog.create({
    data: {
      userId: input.userId,
      channel: "in_app",
      type: input.templateFamily,
      status: "queued",
      payload: { title: input.title, body: input.body, ...(input.metadata ?? {}) } as object,
    },
  });
  return { ok: true, id: row.id };
}
