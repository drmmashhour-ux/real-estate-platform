import type { PrismaClient } from "@prisma/client";
import { resolveOnboardingProperty } from "./onboardingFlowService";

function pct(a: number, b: number) {
  return b > 0 ? Math.round((a / b) * 10000) / 100 : 0;
}

export async function getConversionInsights(db: PrismaClient, userId: string) {
  const [profile, seed, events24h, triggerRows] = await Promise.all([
    db.conversionProfile.findUnique({ where: { userId } }),
    resolveOnboardingProperty(db, userId),
    db.trafficEvent.findMany({
      where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      select: { eventType: true, path: true },
      take: 3000,
    }),
    db.conversionAutomationLog.groupBy({
      by: ["triggerType"],
      where: { createdAt: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) } },
      _count: { _all: true },
    }),
  ]);

  const visits = events24h.filter((e) => e.eventType === "page_view").length;
  const signups = events24h.filter((e) => e.eventType === "signup_completed").length;
  const analyses = events24h.filter((e) => e.eventType === "analysis_event").length;
  const leads = events24h.filter((e) => e.eventType === "lead_checkout_started").length;
  const paid = events24h.filter((e) => e.eventType === "lead_purchased" || e.eventType === "subscription_purchased").length;

  return {
    profile,
    onboardingSeed: seed,
    funnel: {
      visits,
      signups,
      analyses,
      leads,
      paid,
      signupToAnalysisRate: pct(analyses, signups),
      analysisToLeadRate: pct(leads, analyses),
      leadToPaidRate: pct(paid, leads),
    },
    bestTriggers: triggerRows
      .map((t) => ({ triggerType: t.triggerType, count: t._count._all }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6),
  };
}
