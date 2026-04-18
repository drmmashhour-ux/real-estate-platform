import { growthV3Flags } from "@/config/feature-flags";
import { prisma } from "@/lib/db";
import type { LifecycleStage } from "./lifecycle.states";
import { inferLifecycleStage, type LifecycleSignals } from "./lifecycle.transitions";

export type LifecycleEvaluation = {
  userId: string;
  stage: LifecycleStage;
  explanation: string[];
  /** Safe, non-destructive action hints — orchestration applies flags + consent. */
  recommendedActions: string[];
};

function actionsForStage(stage: LifecycleStage): string[] {
  switch (stage) {
    case "high_intent":
      return [
        "surface_similar_inventory",
        "offer_broker_intro_if_eligible",
        "in_app_urgency_context_only",
      ];
    case "dormant":
    case "churn_risk":
      return ["reengagement_campaign_candidate", "new_listing_digest_candidate", "price_change_digest_candidate"];
    case "converting":
      return ["reduce_noise", "transaction_assist_surfaces_only"];
    case "active_searcher":
      return ["saved_search_nudge", "similar_listings_row"];
    case "new_user":
      return ["onboarding_completion_nudge", "explore_city_pages"];
    default:
      return ["browse_enrichment", "education_content"];
  }
}

export async function evaluateUserLifecycle(userId: string): Promise<LifecycleEvaluation | null> {
  if (!growthV3Flags.lifecycleEngineV1) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      createdAt: true,
      growthMessagingPaused: true,
    },
  });
  if (!user) return null;

  const since = new Date(Date.now() - 30 * 86400000);
  const [saves, searchEvents, signalEvents, behaviorEvents] = await Promise.all([
    prisma.buyerSavedListing.count({ where: { userId } }),
    prisma.searchEvent.count({ where: { userId, createdAt: { gte: since } } }),
    prisma.growthSignalEvent.count({ where: { userId, createdAt: { gte: since } } }),
    prisma.userBehaviorEvent.count({ where: { userId, createdAt: { gte: since } } }),
  ]);

  const [lastSearch, lastSignal, lastBeh] = await Promise.all([
    prisma.searchEvent.findFirst({ where: { userId }, orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
    prisma.growthSignalEvent.findFirst({ where: { userId }, orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
    prisma.userBehaviorEvent.findFirst({ where: { userId }, orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
  ]);
  const candidates = [lastSearch?.createdAt, lastSignal?.createdAt, lastBeh?.createdAt].filter(Boolean) as Date[];
  const last = candidates.length ? new Date(Math.max(...candidates.map((d) => d.getTime()))) : null;
  const daysSinceLast = last ? (Date.now() - last.getTime()) / 86400000 : null;
  const accountAgeDays = (Date.now() - user.createdAt.getTime()) / 86400000;

  const signals: LifecycleSignals = {
    accountAgeDays,
    savedListingsCount: saves,
    eventsLast30d: searchEvents + signalEvents + behaviorEvents,
    daysSinceLastActivity: daysSinceLast,
    growthMessagingPaused: user.growthMessagingPaused,
  };

  const stage = inferLifecycleStage(signals);
  const explanation = [
    `account_age_days=${accountAgeDays.toFixed(1)}`,
    `saved_listings=${saves}`,
    `events_30d=${signals.eventsLast30d} (search+growth_signal+behavior)`,
    last ? `last_activity=${last.toISOString()}` : "last_activity=unknown",
    user.growthMessagingPaused ? "growth_messaging_paused=true → dormant" : "growth_messaging_paused=false",
  ];

  return {
    userId,
    stage,
    explanation,
    recommendedActions: actionsForStage(stage),
  };
}
