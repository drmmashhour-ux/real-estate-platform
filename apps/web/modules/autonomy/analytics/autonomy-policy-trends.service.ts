import { prisma } from "@/lib/db";
import { startOfDay, subDays, endOfDay } from "date-fns";

export type PolicyTrendData = {
  date: string;
  allowed: number;
  blocked: number;
  approvalRequired: number;
  executed: number;
};

export type DomainDecisionCount = {
  domain: string;
  count: number;
};

export async function getAutonomyPolicyTrends(days: number = 7): Promise<{
  trends: PolicyTrendData[];
  domainDecisions: DomainDecisionCount[];
  totalDecisions: number;
  blockRate: number;
}> {
  const startDate = startOfDay(subDays(new Date(), days));
  const endDate = endOfDay(new Date());

  const actions = await prisma.autonomousActionQueue.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      createdAt: true,
      status: true,
      requiresApproval: true,
      domain: true,
    },
  });

  // Group by date
  const dateGroups: Record<string, PolicyTrendData> = {};
  for (let i = 0; i <= days; i++) {
    const d = formatISO(subDays(new Date(), i));
    dateGroups[d] = {
      date: d,
      allowed: 0,
      blocked: 0,
      approvalRequired: 0,
      executed: 0,
    };
  }

  const domainCounts: Record<string, number> = {};

  actions.forEach((a) => {
    const dateStr = formatISO(a.createdAt);
    if (dateGroups[dateStr]) {
      if (a.status === "BLOCKED") dateGroups[dateStr].blocked++;
      else if (a.status === "EXECUTED") {
        dateGroups[dateStr].executed++;
        dateGroups[dateStr].allowed++;
      } else if (a.status === "QUEUED") {
        dateGroups[dateStr].allowed++;
      }
      
      if (a.requiresApproval) dateGroups[dateStr].approvalRequired++;
    }

    domainCounts[a.domain] = (domainCounts[a.domain] || 0) + 1;
  });

  const trends = Object.values(dateGroups).sort((a, b) => a.date.localeCompare(b.date));
  const domainDecisions = Object.entries(domainCounts).map(([domain, count]) => ({
    domain,
    count,
  })).sort((a, b) => b.count - a.count);

  const totalDecisions = actions.length;
  const totalBlocked = actions.filter(a => a.status === "BLOCKED").length;
  const blockRate = totalDecisions > 0 ? (totalBlocked / totalDecisions) : 0;

  return {
    trends,
    domainDecisions,
    totalDecisions,
    blockRate,
  };
}

function formatISO(date: Date): string {
  return date.toISOString().split("T")[0];
}
