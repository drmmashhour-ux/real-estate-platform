import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export async function recordEvent(
  propertyIdentityId: string,
  eventType: string,
  eventData: Record<string, unknown> | null,
  createdBy: string | null
): Promise<void> {
  await prisma.propertyIdentityEvent.create({
    data: {
      propertyIdentityId,
      eventType,
      eventData: (eventData ?? undefined) as Prisma.InputJsonValue | undefined,
      createdBy: createdBy ?? undefined,
    },
  });
}
