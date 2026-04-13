import { prisma } from "@/lib/db";
import { brokerCrmKpis } from "@/lib/broker-crm/list-leads";
import { countSuggestedAutopilotActions } from "@/lib/broker-autopilot/list-actions";

export async function getBrokerAutopilotDashboardSummary(brokerUserId: string, isAdmin: boolean) {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const base = isAdmin ? {} : { brokerUserId };

  const [kpis, suggestedActions, hotLeads, followUpsDueToday, overdue] = await Promise.all([
    brokerCrmKpis(brokerUserId, isAdmin),
    countSuggestedAutopilotActions(brokerUserId, isAdmin),
    prisma.lecipmBrokerCrmLead.count({
      where: {
        ...base,
        priorityLabel: "high",
        status: { notIn: ["closed", "lost"] },
      },
    }),
    prisma.lecipmBrokerCrmLead.count({
      where: {
        ...base,
        nextFollowUpAt: { gte: startOfDay, lt: endOfDay },
        status: { notIn: ["closed", "lost"] },
      },
    }),
    prisma.lecipmBrokerCrmLead.count({
      where: {
        ...base,
        nextFollowUpAt: { lt: now },
        status: { notIn: ["closed", "lost"] },
      },
    }),
  ]);

  return {
    kpis,
    suggestedActions,
    hotLeads,
    followUpsDueToday,
    overdueFollowups: overdue,
    newLeads: kpis.newLeads,
  };
}
