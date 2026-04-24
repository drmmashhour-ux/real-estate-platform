import { prisma } from "@/lib/db";
import { brokerCrmKpis } from "@/lib/broker-crm/list-leads";
import { playbookLog } from "@/modules/playbook-memory/playbook-memory.logger";

export type BrokerCrmInsights = {
  pipeline: {
    openLeads: number;
    stuckFollowUps: number;
    newLeads: number;
    highPriority: number;
  };
  /** Queue depth for autopilot-suggested items (non-auto-sent). */
  suggestedBacklog: number;
  /** Plain-language for CRM surfaces. */
  notes: string[];
  generatedAt: string;
};

/**
 * Broker CRM dashboard-level insights. Internal analytics only. Never throws.
 */
export async function getInsights(brokerUserId: string, isAdmin: boolean): Promise<BrokerCrmInsights | null> {
  try {
    if (!brokerUserId) {
      return null;
    }
    const [kpis, allOpen, stale, backlog] = await Promise.all([
      brokerCrmKpis(brokerUserId, isAdmin),
      prisma.lecipmBrokerCrmLead.count({
        where: isAdmin ? { status: { notIn: ["closed", "lost"] } } : { brokerUserId, status: { notIn: ["closed", "lost"] } },
      }),
      prisma.lecipmBrokerCrmLead.count({
        where: isAdmin
          ? {
              status: { notIn: ["closed", "lost"] },
              nextFollowUpAt: { lt: new Date(Date.now() - 2 * 86_400_000) },
            }
          : {
              brokerUserId,
              status: { notIn: ["closed", "lost"] },
              nextFollowUpAt: { lt: new Date(Date.now() - 2 * 86_400_000) },
            },
      }),
      prisma.lecipmBrokerAutopilotAction.count({
        where: isAdmin
          ? { status: "suggested", reasonBucket: "playbook_recommendation" }
          : { brokerUserId, status: "suggested", reasonBucket: "playbook_recommendation" },
      }),
    ]);

    const stuckFollowUps = stale;
    const notes: string[] = [];
    if (stuckFollowUps > 0) {
      notes.push(`You have about ${stuckFollowUps} open lead(s) with a follow-up date in the past — a common bottleneck.`);
    }
    if (kpis.highPriority > 0) {
      notes.push(`High-priority count: ${kpis.highPriority} (rule-based, from thread signals).`);
    }
    if (backlog > 0) {
      notes.push(`Playbook-based suggestions waiting for review: ${backlog} (no messages are sent automatically).`);
    }
    if (notes.length === 0) {
      notes.push("No major bottlenecks auto-flagged. Keep follow-ups and stages current.");
    }

    return {
      pipeline: {
        openLeads: allOpen,
        stuckFollowUps,
        newLeads: kpis.newLeads,
        highPriority: kpis.highPriority,
      },
      suggestedBacklog: backlog,
      notes: notes.slice(0, 8),
      generatedAt: new Date().toISOString(),
    };
  } catch (e) {
    playbookLog.warn("getInsights", { message: e instanceof Error ? e.message : String(e) });
    return null;
  }
}
