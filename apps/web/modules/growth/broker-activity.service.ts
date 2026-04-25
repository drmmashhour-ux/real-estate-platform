import { prisma } from "@/lib/db";

export const BROKER_ACTIVITY_TYPES = {
  leadViewed: "lead_viewed",
  aiSuggestionUsed: "ai_suggestion_used",
  contactAttempt: "contact_attempt",
} as const;

export type BrokerActivityEventType = (typeof BROKER_ACTIVITY_TYPES)[keyof typeof BROKER_ACTIVITY_TYPES];

function distinctLeadViewCount(activities: { eventType: string; refId: string | null }[]): number {
  const ids = new Set<string>();
  for (const a of activities) {
    if (a.eventType === BROKER_ACTIVITY_TYPES.leadViewed && a.refId) ids.add(a.refId);
  }
  return ids.size;
}

/**
 * A broker is “active” when: ≥3 distinct leads viewed, OR any AI suggestion use, OR any contact attempt.
 */
export async function isBrokerActive(brokerId: string): Promise<boolean> {
  const rows = await prisma.brokerActivity.findMany({
    where: { brokerId },
    select: { eventType: true, refId: true, createdAt: true },
  });
  if (rows.some((r) => r.eventType === BROKER_ACTIVITY_TYPES.aiSuggestionUsed)) return true;
  if (rows.some((r) => r.eventType === BROKER_ACTIVITY_TYPES.contactAttempt)) return true;
  return distinctLeadViewCount(rows) >= 3;
}

export async function recordBrokerActivity(
  brokerId: string,
  eventType: BrokerActivityEventType,
  refId?: string | null,
  metadata?: Record<string, unknown>
) {
  return prisma.brokerActivity.create({
    data: {
      brokerId,
      eventType,
      refId: refId?.slice(0, 64) ?? null,
      metadata: (metadata ?? {}) as object,
    },
  });
}
