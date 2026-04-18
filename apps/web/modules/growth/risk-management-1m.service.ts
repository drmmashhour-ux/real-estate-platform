/**
 * Enterprise risk hints — fraud / abuse / imbalance heuristics; recommendations only (no auto-ban).
 */

import { prisma } from "@/lib/db";
import { getMarketplaceBalance } from "./marketplace-balance.service";

export type RiskManagement1mSnapshot = {
  duplicateContactSignals: number;
  velocityAlerts: string[];
  imbalanceAlerts: string[];
  recommendations: string[];
};

export async function getRiskManagement1mSnapshot(): Promise<RiskManagement1mSnapshot> {
  const recent = await prisma.lead.findMany({
    where: { createdAt: { gte: new Date(Date.now() - 7 * 86_400_000) } },
    select: { email: true, phone: true },
    take: 15_000,
  });

  const emailCount = new Map<string, number>();
  for (const l of recent) {
    const e = (l.email ?? "").trim().toLowerCase();
    if (e) emailCount.set(e, (emailCount.get(e) ?? 0) + 1);
  }
  const duplicateContactSignals = [...emailCount.values()].filter((n) => n >= 4).length;

  const velocityAlerts: string[] = [];
  const unlocks = await prisma.revenueEvent.count({
    where: {
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60_000) },
      eventType: { in: ["lead_unlock", "lead_purchased"] },
    },
  });
  if (unlocks > 200) {
    velocityAlerts.push("Unusually high 24h lead-unlock volume — spot-check for card testing or abuse.");
  }

  const mb = await getMarketplaceBalance();
  const imbalanceAlerts: string[] = [];
  if (mb.balance === "oversupply") imbalanceAlerts.push("Supply/demand skew: too many leads per broker — fraud risk on resale / spam intake.");
  if (mb.balance === "undersupply") imbalanceAlerts.push("Thin pipeline may incentivize bad lead buying — monitor broker complaints.");

  const recommendations: string[] = [];
  if (duplicateContactSignals > 0) {
    recommendations.push("Review duplicate CRM emails for bot/spam clusters (manual moderation).");
  }
  if (velocityAlerts.length) recommendations.push("Temporarily tighten unlock velocity limits in Stripe Radar / internal policy (operator).");
  recommendations.push("Maintain broker ToS enforcement and dispute playbook — no automatic account closure from this panel.");

  return {
    duplicateContactSignals,
    velocityAlerts,
    imbalanceAlerts,
    recommendations,
  };
}
