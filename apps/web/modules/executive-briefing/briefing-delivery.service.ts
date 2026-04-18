import { prisma } from "@/lib/db";
import type { ExecutiveBriefingDeliveryChannel } from "@prisma/client";

/**
 * Records delivery intent — no outbound email send in v1 (email_draft = draft artifact only).
 */
export async function recordBriefingDeliveryDraft(input: {
  briefingId: string;
  channel: ExecutiveBriefingDeliveryChannel;
  metadata?: Record<string, unknown>;
}): Promise<{ deliveryId: string }> {
  const row = await prisma.executiveBriefingDelivery.create({
    data: {
      briefingId: input.briefingId,
      channel: input.channel,
      status: input.channel === "email_draft" ? "pending" : "completed",
      deliveredAt: input.channel === "in_app" ? new Date() : null,
      metadata: (input.metadata ?? {}) as object,
    },
    select: { id: true },
  });
  if (input.channel === "in_app") {
    await prisma.executiveBriefing.update({
      where: { id: input.briefingId },
      data: { status: "delivered" },
    });
  }
  return { deliveryId: row.id };
}
