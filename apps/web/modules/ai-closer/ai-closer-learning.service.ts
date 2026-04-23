import { prisma } from "@/lib/db";

export type AiCloserLearningSnapshot = {
  recommendationsLogged30d: number;
  stagesCounts: Record<string, number>;
  objectionsCounts: Record<string, number>;
  escalationRateApprox: number | null;
  bookingSignals30d: number;
};

/** Aggregates timeline rows — effectiveness weights can be layered later without schema migration. */
export async function getAiCloserLearningSnapshot(): Promise<AiCloserLearningSnapshot> {
  const since = new Date(Date.now() - 30 * 86400000);

  const recent = await prisma.leadTimelineEvent.findMany({
    where: { eventType: "AI_CLOSER_RECOMMENDATION", createdAt: { gte: since } },
    select: { payload: true },
    take: 2000,
  });

  let esc = 0;
  let bookings = 0;
  const stagesCounts: Record<string, number> = {};
  const objectionsCounts: Record<string, number> = {};

  for (const r of recent) {
    const p = r.payload as Record<string, unknown> | null;
    if (p?.shouldEscalate === true) esc++;
    if (p?.shouldAttemptBooking === true) bookings++;
    const st = typeof p?.detectedStage === "string" ? p.detectedStage : "unknown";
    const ob = typeof p?.objection === "string" ? p.objection : "unknown";
    stagesCounts[st] = (stagesCounts[st] ?? 0) + 1;
    objectionsCounts[ob] = (objectionsCounts[ob] ?? 0) + 1;
  }

  const recs = recent.length;

  return {
    recommendationsLogged30d: recs,
    stagesCounts,
    objectionsCounts,
    escalationRateApprox: recs > 0 ? Math.round((esc / recs) * 1000) / 1000 : null,
    bookingSignals30d: bookings,
  };
}

export function recordCloserLearningNote(event: "line_used" | "objection_resolved" | "booking_won", meta: object): void {
  void event;
  void meta;
  // Hook for future weighted updates — intentionally no-op to avoid silent DB growth.
}
