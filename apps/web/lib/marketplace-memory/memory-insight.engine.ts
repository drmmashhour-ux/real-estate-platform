import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { MarketplaceMemoryInsightType } from "@prisma/client";
import { logMemoryAudit } from "@/lib/marketplace-memory/memory-audit";

type TopLoc = { location: string; score: number };
type TopType = { propertyType: string; score: number };

function confidenceFromRank(rankScore: number, totalScore: number): number {
  if (totalScore <= 0) return 0.3;
  const r = Math.min(1, rankScore / totalScore);
  return Math.round(Math.min(0.95, 0.35 + r * 0.55) * 100) / 100;
}

/**
 * Regenerates explainable insights linked to summarized memory (deterministic copy).
 */
export async function refreshUserMemoryInsights(userId: string): Promise<void> {
  const profile = await prisma.userMemoryProfile.findUnique({ where: { userId } });
  if (!profile || !profile.personalizationEnabled) return;

  const pref = profile.preferenceSummaryJson as {
    topLocations?: TopLoc[];
    topPropertyTypes?: TopType[];
    budgetRange?: { min: number | null; max: number | null; note?: string } | null;
  };
  const intent = profile.intentSummaryJson as { urgencyScore?: number };
  const esg = profile.esgProfileJson as { interestLevel?: number } | null;
  const risk = profile.riskProfileJson as { valueAddOrHighRiskMentions?: number } | null;

  const insights: Prisma.UserMemoryInsightCreateManyInput[] = [];
  const sourceStub = { profileSnapshotAt: profile.lastUpdatedAt.toISOString() };

  const locs = pref?.topLocations ?? [];
  if (locs[0]) {
    const total = locs.reduce((s, x) => s + x.score, 0);
    insights.push({
      userId,
      insightType: MarketplaceMemoryInsightType.LOCATION_AFFINITY,
      key: "primary_location",
      value: `Shows repeated interest around ${locs[0].location} (weighted activity).`,
      confidenceScore: confidenceFromRank(locs[0].score, total),
      sourceEventsJson: { ...sourceStub, topLocations: locs.slice(0, 3) },
    });
  }

  const types = pref?.topPropertyTypes ?? [];
  const br = pref?.budgetRange;
  if (types.length > 0 || br?.min != null || br?.max != null) {
    const typeStr = types[0] ? types[0].propertyType : "mixed types";
    const budgetStr =
      br?.min != null && br?.max != null
        ? `$${br.min.toLocaleString()}–$${br.max.toLocaleString()}`
        : br?.min != null
          ? `from $${br.min.toLocaleString()}`
          : br?.max != null
            ? `up to $${br.max.toLocaleString()}`
            : "";
    insights.push({
      userId,
      insightType: MarketplaceMemoryInsightType.PREFERENCE,
      key: "property_and_budget",
      value: [budgetStr ? `Inferred interest in ${typeStr} around ${budgetStr}.` : `Inferred interest in ${typeStr}.`, br?.note]
        .filter(Boolean)
        .join(" "),
      confidenceScore: budgetStr ? 0.62 : 0.55,
      sourceEventsJson: { ...sourceStub, topPropertyTypes: types.slice(0, 3), budgetRange: br },
    });
  }

  const u = intent?.urgencyScore ?? 0;
  if (u >= 40) {
    insights.push({
      userId,
      insightType: MarketplaceMemoryInsightType.TIMING,
      key: "activity_burst",
      value: "Recent activity suggests higher readiness to act — prioritize timely, non-pushy follow-up.",
      confidenceScore: Math.min(0.85, 0.4 + u / 200),
      sourceEventsJson: { ...sourceStub, urgencyScore: u },
    });
  }

  if (esg?.interestLevel != null && esg.interestLevel > 0.2) {
    insights.push({
      userId,
      insightType: MarketplaceMemoryInsightType.PREFERENCE,
      key: "esg",
      value: "Signals interest in energy or ESG-oriented properties — surface efficient or certified options when relevant.",
      confidenceScore: Math.min(0.8, 0.45 + esg.interestLevel * 0.4),
      sourceEventsJson: { ...sourceStub, esgProfile: esg },
    });
  }

  if (risk && (risk.valueAddOrHighRiskMentions ?? 0) > 0) {
    insights.push({
      userId,
      insightType: MarketplaceMemoryInsightType.RISK,
      key: "investor_value_add",
      value: "Behavior suggests appetite for value-add or higher-complexity opportunities — verify suitability and disclosures.",
      confidenceScore: 0.58,
      sourceEventsJson: { ...sourceStub, riskProfile: risk },
    });
  }

  const buy = (intent as { buySignals?: number })?.buySignals ?? 0;
  const invest = (intent as { investSignals?: number })?.investSignals ?? 0;
  if (buy > invest && buy > 35) {
    insights.push({
      userId,
      insightType: MarketplaceMemoryInsightType.INTENT,
      key: "buy_intent",
      value: "Browse/save/offer pattern leans toward acquisition — consider buyer-side resources.",
      confidenceScore: 0.55,
      sourceEventsJson: { ...sourceStub, buySignals: buy, investSignals: invest },
    });
  } else if (invest > buy && invest > 35) {
    insights.push({
      userId,
      insightType: MarketplaceMemoryInsightType.INTENT,
      key: "invest_intent",
      value: "Activity leans toward investment workflows — align with packet and risk materials.",
      confidenceScore: 0.55,
      sourceEventsJson: { ...sourceStub, buySignals: buy, investSignals: invest },
    });
  }

  await prisma.userMemoryInsight.deleteMany({ where: { userId } });
  if (insights.length > 0) {
    await prisma.userMemoryInsight.createMany({ data: insights });
  }

  void logMemoryAudit({
    userId,
    actionType: "insight_generated",
    summary: `Regenerated ${insights.length} memory insights`,
    details: { count: insights.length },
  }).catch(() => null);
}
