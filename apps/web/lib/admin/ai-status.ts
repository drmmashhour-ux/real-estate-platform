import { prisma } from "@/lib/db";

export type AdminAiStatus = {
  queuePricing: number;
  queueDescriptions: number;
  queueCompleteness: number;
  queuePromotions: number;
  autopilot24h: number;
  failures24h: number;
  /** Read from env — operational toggles are deployment-scoped. */
  toggles: {
    pricingAi: boolean;
    messagingAi: boolean;
    promoAi: boolean;
    listingOptimizationAi: boolean;
    autopilotPaused: boolean;
  };
};

export async function getAdminAIStatus(): Promise<AdminAiStatus> {
  const since = new Date(Date.now() - 24 * 3600000);

  const [queue, autopilot24h, failures24h] = await Promise.all([
    prisma.bnhubEngineAuditLog.groupBy({
      by: ["decisionType"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
    }),
    prisma.bnhubEngineAuditLog.count({
      where: {
        createdAt: { gte: since },
        OR: [{ decisionType: { startsWith: "AUTO_" } }, { source: "autopilot" }],
      },
    }),
    prisma.bnhubEngineAuditLog.count({
      where: {
        createdAt: { gte: since },
        OR: [{ decisionType: { contains: "fail" } }, { decisionType: { contains: "error" } }],
      },
    }),
  ]);

  const byType = new Map(queue.map((q) => [q.decisionType, q._count._all]));
  const pick = (prefix: string) =>
    [...byType.entries()].filter(([k]) => k.toLowerCase().includes(prefix)).reduce((s, [, v]) => s + v, 0);

  return {
    queuePricing: pick("price"),
    queueDescriptions: pick("desc"),
    queueCompleteness: pick("complete"),
    queuePromotions: pick("promo"),
    autopilot24h,
    failures24h,
    toggles: {
      pricingAi: process.env.LECIPM_AI_PRICING_ENABLED !== "false",
      messagingAi: process.env.LECIPM_AI_MESSAGING_ENABLED !== "false",
      promoAi: process.env.LECIPM_AI_PROMO_ENABLED !== "false",
      listingOptimizationAi: process.env.LECIPM_AI_LISTING_OPT_ENABLED !== "false",
      autopilotPaused: process.env.LECIPM_AI_AUTOPILOT_PAUSED === "true",
    },
  };
}
