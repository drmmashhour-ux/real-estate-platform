import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

const db = prisma as unknown as {
  viralGrowthEvent: { create: (args: object) => Promise<unknown> };
};

export async function trackViralEvent(
  eventType: "share" | "invite_sent" | "referral_conversion",
  metadata: Record<string, unknown> = {},
  userId?: string | null
): Promise<void> {
  try {
    await db.viralGrowthEvent.create({
      data: {
        eventType,
        metadata: metadata as Prisma.InputJsonValue,
        userId: userId ?? null,
      },
    });
  } catch (e) {
    console.warn("[viralTracking]", eventType, e);
  }
}
