import { prisma } from "@/lib/db";

import { getAiSalesAgentConfig } from "./ai-sales-config.service";

export type AiSalesAgentMetrics = {
  mode: string;
  leadsTouched30d: number;
  messagesSent30d: number;
  escalations30d: number;
  bookingsRecorded30d: number;
  sequenceJobsCompleted30d: number;
  conversionRateApprox: number | null;
};

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 86400000);
}

/** Aggregates explainable counters from `LeadTimelineEvent` + jobs (no ML). */
export async function getAiSalesAgentMetrics(): Promise<AiSalesAgentMetrics> {
  const cfg = await getAiSalesAgentConfig();
  const since = daysAgo(30);

  const [triggered, sent, escalation, booking, jobs] = await Promise.all([
    prisma.leadTimelineEvent.count({
      where: { eventType: "AI_SALES_TRIGGERED", createdAt: { gte: since } },
    }),
    prisma.leadTimelineEvent.count({
      where: { eventType: "AI_SALES_MESSAGE_SENT", createdAt: { gte: since } },
    }),
    prisma.leadTimelineEvent.count({
      where: { eventType: "AI_SALES_ESCALATION", createdAt: { gte: since } },
    }),
    prisma.leadTimelineEvent.count({
      where: { eventType: "AI_SALES_BOOKING_CONFIRMED", createdAt: { gte: since } },
    }),
    prisma.leadFollowUpJob.count({
      where: {
        jobKey: { startsWith: "ai_sales_seq_" },
        status: "completed",
        processedAt: { gte: since },
      },
    }),
  ]);

  const leadsWithBooking = await prisma.leadTimelineEvent.groupBy({
    by: ["leadId"],
    where: {
      eventType: "AI_SALES_BOOKING_CONFIRMED",
      createdAt: { gte: since },
    },
    _count: { _all: true },
  });

  const conversionRateApprox =
    triggered > 0 ? Math.round((leadsWithBooking.length / triggered) * 1000) / 1000 : null;

  return {
    mode: cfg.mode,
    leadsTouched30d: triggered,
    messagesSent30d: sent,
    escalations30d: escalation,
    bookingsRecorded30d: booking,
    sequenceJobsCompleted30d: jobs,
    conversionRateApprox,
  };
}
