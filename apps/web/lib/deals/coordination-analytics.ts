import { prisma } from "@/lib/db";

/** Lightweight aggregates for broker dashboards — uses audit log + request rows. */
export async function coordinationMetricsForDeal(dealId: string) {
  const [requests, audits] = await Promise.all([
    prisma.dealRequest.findMany({
      where: { dealId },
      select: { status: true, createdAt: true, fulfilledAt: true },
    }),
    prisma.dealCoordinationAuditLog.findMany({
      where: { dealId },
      select: { action: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);

  const fulfilled = requests.filter((r) => r.status === "FULFILLED").length;
  const open = requests.filter((r) => !["FULFILLED", "CANCELLED"].includes(r.status)).length;

  return {
    requestCount: requests.length,
    fulfilledCount: fulfilled,
    openCount: open,
    recentAuditActions: audits.slice(0, 20),
  };
}
