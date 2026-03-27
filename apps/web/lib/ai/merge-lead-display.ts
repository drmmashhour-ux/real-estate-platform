import { prisma } from "@/lib/db";
import { mergeFormAndBehaviorScore, type BehaviorScoreBreakdown } from "./behavior-scoring";
import { recommendedActionsForLead, tierEmoji, tierFromScore, type LeadTier } from "./lead-tier";

/** Subset of behavior we show brokers (from last 30d activity log aggregation). */
export type LeadBehaviorActivity = {
  searchEvents: number;
  listingViews: number;
  savedListings: number;
  messagesSent: number;
  repeatVisitDays: number;
};

function breakdownToActivity(b: BehaviorScoreBreakdown | null | undefined): LeadBehaviorActivity | null {
  if (!b || typeof b !== "object") return null;
  return {
    searchEvents: typeof b.searchEvents === "number" ? b.searchEvents : 0,
    listingViews: typeof b.listingViews === "number" ? b.listingViews : 0,
    savedListings: typeof b.savedListings === "number" ? b.savedListings : 0,
    messagesSent: typeof b.messagesSent === "number" ? b.messagesSent : 0,
    repeatVisitDays: typeof b.repeatVisitDays === "number" ? b.repeatVisitDays : 0,
  };
}

export type LeadDisplayPayload = {
  score: number;
  temperature: LeadTier;
  temperatureEmoji: string;
  explanation: string;
  recommendedActions: string[];
  /** Populated when a platform user is linked and we have a UserAiProfile snapshot. */
  behaviorActivity: LeadBehaviorActivity | null;
  aiMeta: Record<string, unknown>;
};

export async function enrichLeadForBrokerDashboard(lead: {
  id: string;
  email: string;
  score: number;
  createdAt: Date;
  lastFollowUpAt: Date | null;
  userId: string | null;
}): Promise<LeadDisplayPayload> {
  let behaviorScore = 0;
  let formScore = lead.score;
  let behaviorActivity: LeadBehaviorActivity | null = null;

  if (lead.userId) {
    const profile = await prisma.userAiProfile.findUnique({ where: { userId: lead.userId } });
    behaviorScore = profile?.behaviorLeadScore ?? 0;
    behaviorActivity = breakdownToActivity(profile?.scoreBreakdown as BehaviorScoreBreakdown | undefined);
  } else {
    const user = await prisma.user.findUnique({ where: { email: lead.email }, select: { id: true } });
    if (user) {
      const profile = await prisma.userAiProfile.findUnique({ where: { userId: user.id } });
      behaviorScore = profile?.behaviorLeadScore ?? 0;
      behaviorActivity = breakdownToActivity(profile?.scoreBreakdown as BehaviorScoreBreakdown | undefined);
    }
  }

  const merged =
    behaviorScore > 0 ? mergeFormAndBehaviorScore(formScore, behaviorScore).merged : formScore;
  const temperature = tierFromScore(merged);
  const daysSinceCreated = (Date.now() - lead.createdAt.getTime()) / (1000 * 60 * 60 * 24);

  const explanationParts: string[] = [];
  if (behaviorScore > 0) {
    explanationParts.push(
      `Form score ${formScore} + behavior ${behaviorScore} → merged ${merged} (weighted 55% / 45%).`
    );
    if (behaviorActivity) {
      explanationParts.push(
        `Activity (30d): ${behaviorActivity.searchEvents} searches, ${behaviorActivity.listingViews} listing views, ${behaviorActivity.savedListings} saves, ${behaviorActivity.messagesSent} messages.`
      );
    }
  } else {
    explanationParts.push(`Form-based score ${merged} (no behavior profile linked).`);
  }

  return {
    score: merged,
    temperature,
    temperatureEmoji: tierEmoji(temperature),
    explanation: explanationParts.join(" "),
    recommendedActions: recommendedActionsForLead({
      tier: temperature,
      daysSinceCreated,
      lastFollowUpAt: lead.lastFollowUpAt,
    }),
    behaviorActivity,
    aiMeta: {
      formScore,
      behaviorScore,
      merged,
      explainable: true,
      engine: "rule_v1",
    },
  };
}
