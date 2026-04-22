import { prisma } from "@/lib/db";

import type { BrokerDashboardData } from "../view-models";

export async function getBrokerDashboardData(userId: string): Promise<BrokerDashboardData> {
  const [activeLeads, brokerClients, paidLeadUnlocksLifetime, pipelineRows] = await Promise.all([
    prisma.brokerLead.count({
      where: {
        brokerId: userId,
        status: { notIn: ["closed", "lost"] },
      },
    }),
    prisma.brokerClient.count({ where: { brokerId: userId } }),
    prisma.brokerLead.count({
      where: { brokerId: userId, billingStatus: "paid" },
    }),
    prisma.brokerLead.findMany({
      where: {
        brokerId: userId,
        status: { notIn: ["closed", "lost"] },
      },
      select: { price: true },
    }),
  ]);

  const pipelineUsd = pipelineRows.reduce((s, r) => s + (Number.isFinite(r.price) ? r.price : 0), 0);
  const pipelineValueCents = Math.round(pipelineUsd * 100);

  return {
    activeLeads,
    brokerClients,
    paidLeadUnlocksLifetime,
    pipelineValueCents,
  };
}
