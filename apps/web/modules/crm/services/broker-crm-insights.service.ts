/**
 * Broker CRM insights (`getInsights`) — dashboard analytics for stalled / uncontacted / ignored leads
 * and early-stage deal bottlenecks. Consumed by `GET /api/crm/insights` and `BrokerCrmHomeClient`.
 * Suggest-only; no messaging or financial automation. Never throws.
 *
 * STEP 5 — Operational insights: stalled, uncontacted, high-score ignored, deal bottlenecks, overdue follow-ups.
 * Related: assignments + outcomes in `broker-crm-autopilot.service.ts` / `broker-crm-outcome.service.ts`;
 * deal heuristics in `broker-crm-deal-intelligence.service.ts` (`evaluateDealProgress`).
 */

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
  /** Operational metrics for autopilot dashboards. */
  operational: {
    /** Follow-ups overdue ~2+ days (same basis as stuckFollowUps). */
    stalledLeads: number;
    /** Open leads with `nextFollowUpAt` strictly before now. */
    overdueFollowUps: number;
    /** Open leads still `new` or never contacted. */
    uncontactedLeads: number;
    /** High/medium priority but still new/contacted with no recent touch. */
    highScoreIgnoredLeads: number;
    /** Broker deals stuck in early stages ~14d+. */
    dealBottlenecks: number;
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
    const baseLead = isAdmin ? {} : { brokerUserId };
    const baseDeal = isAdmin ? {} : { brokerId: brokerUserId };

    const staleCutoff = new Date(Date.now() - 2 * 86_400_000);
    const ignoredCutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const dealStuckCutoff = new Date(Date.now() - 14 * 86_400_000);

    const now = new Date();
    const [kpis, allOpen, stale, overdueFollowUps, backlog, uncontacted, highIgnored, dealBottlenecks] =
      await Promise.all([
      brokerCrmKpis(brokerUserId, isAdmin),
      prisma.lecipmBrokerCrmLead.count({
        where: { ...baseLead, status: { notIn: ["closed", "lost"] } },
      }),
      prisma.lecipmBrokerCrmLead.count({
        where: {
          ...baseLead,
          status: { notIn: ["closed", "lost"] },
          nextFollowUpAt: { lt: staleCutoff },
        },
      }),
      prisma.lecipmBrokerCrmLead.count({
        where: {
          ...baseLead,
          status: { notIn: ["closed", "lost"] },
          nextFollowUpAt: { lt: now },
        },
      }),
      prisma.lecipmBrokerAutopilotAction.count({
        where: isAdmin
          ? { status: "suggested", reasonBucket: "playbook_recommendation" }
          : { brokerUserId, status: "suggested", reasonBucket: "playbook_recommendation" },
      }),
      prisma.lecipmBrokerCrmLead.count({
        where: {
          ...baseLead,
          status: { notIn: ["closed", "lost"] },
          OR: [{ status: "new" }, { lastContactAt: null }],
        },
      }),
      prisma.lecipmBrokerCrmLead.count({
        where: {
          ...baseLead,
          status: { in: ["new", "contacted"] },
          priorityLabel: { in: ["high", "medium"] },
          OR: [{ lastContactAt: null }, { lastContactAt: { lt: ignoredCutoff } }],
        },
      }),
      prisma.deal.count({
        where: {
          ...baseDeal,
          status: { in: ["initiated", "offer_submitted"] },
          updatedAt: { lt: dealStuckCutoff },
        },
      }),
    ]);

    const stuckFollowUps = stale;
    const notes: string[] = [];
    if (stuckFollowUps > 0) {
      notes.push(`About ${stuckFollowUps} open lead(s) have follow-up dates lagging — clear or reschedule them.`);
    }
    if (uncontacted > 0) {
      notes.push(`${uncontacted} open lead(s) look uncontacted or still marked new — prioritize first touch (in-app only).`);
    }
    if (highIgnored > 0) {
      notes.push(`${highIgnored} warm/hot lead(s) may be waiting without a recent logged contact.`);
    }
    if (kpis.highPriority > 0) {
      notes.push(`High-priority count: ${kpis.highPriority} (rule-based, from thread signals).`);
    }
    if (backlog > 0) {
      notes.push(`Playbook suggestions awaiting review: ${backlog} (messages are never auto-sent).`);
    }
    if (dealBottlenecks > 0) {
      notes.push(`${dealBottlenecks} deal(s) in early stages unchanged for ~2+ weeks — check milestones.`);
    }
    if (overdueFollowUps > 0) {
      notes.push(`${overdueFollowUps} open lead(s) have a follow-up date in the past — reschedule or complete.`);
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
      operational: {
        stalledLeads: stuckFollowUps,
        overdueFollowUps,
        uncontactedLeads: uncontacted,
        highScoreIgnoredLeads: highIgnored,
        dealBottlenecks,
      },
      suggestedBacklog: backlog,
      notes: notes.slice(0, 10),
      generatedAt: new Date().toISOString(),
    };
  } catch (e) {
    playbookLog.warn("getInsights", { message: e instanceof Error ? e.message : String(e) });
    return null;
  }
}
