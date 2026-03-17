import { prisma } from "@/lib/db";

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
      eventData: eventData ?? undefined,
      createdBy: createdBy ?? undefined,
    },
  });
}
