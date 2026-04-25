import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export async function appendLeadTimeline(
  leadId: string,
  eventType: string,
  payload?: Record<string, unknown>
): Promise<void> {
  const safePayload: Prisma.InputJsonValue | undefined = payload
    ? (() => {
        try {
          return JSON.parse(JSON.stringify(payload)) as Prisma.InputJsonValue;
        } catch {
          return undefined;
        }
      })()
    : undefined;

  await prisma.leadTimelineEvent.create({
    data: {
      leadId,
      eventType,
      payload: safePayload,
    },
  });
}
