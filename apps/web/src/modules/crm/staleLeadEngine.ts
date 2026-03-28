import { prisma } from "@/lib/db";
import { appendLeadTimelineEvent } from "@/lib/leads/timeline-helpers";
import { refreshLeadExecutionLayer } from "./leadExecutionRefresh";

const STALE_HOURS = 24;

export type StaleLeadCandidate = {
  leadId: string;
  name: string;
  email: string;
  intentScore: number;
  hoursIdle: number;
};

/**
 * High-intent leads with no CRM activity in the last 24h (reactivation queue).
 */
export async function findStaleHighIntentLeads(minIntent = 60): Promise<StaleLeadCandidate[]> {
  const cutoff = new Date(Date.now() - STALE_HOURS * 3600 * 1000);
  const rows = await prisma.lead.findMany({
    where: {
      intentScore: { gte: minIntent },
      executionStage: { notIn: ["lost", "closed"] },
      OR: [{ lastActivityAt: { lt: cutoff } }, { lastActivityAt: null }],
    },
    select: {
      id: true,
      name: true,
      email: true,
      intentScore: true,
      lastActivityAt: true,
      updatedAt: true,
    },
    take: 100,
  });

  return rows.map((r) => {
    const ref = r.lastActivityAt ?? r.updatedAt;
    const hoursIdle = (Date.now() - ref.getTime()) / 36e5;
    return { leadId: r.id, name: r.name, email: r.email, intentScore: r.intentScore, hoursIdle };
  });
}

/** Bump priority + log for follow-up automation / operator. */
export async function reactivateStaleLead(leadId: string): Promise<void> {
  await prisma.lead.update({
    where: { id: leadId },
    data: {
      nextBestAction: "send_follow_up",
    },
  });
  await appendLeadTimelineEvent(leadId, "crm_stale_reactivation", { source: "stale_lead_engine" });
  await refreshLeadExecutionLayer(leadId);
}
