/** i18n keys under `marketingEngine.optimization.*` — resolve with t() or translateServer. */
export const MARKETING_OPTIMIZATION_NOTE_KEYS = {
  noHistory: "marketingEngine.optimization.noHistory",
  weightedScores: "marketingEngine.optimization.weightedScores",
} as const;

export type MarketingOptimizationHint = {
  boostTopics: string[];
  reduceTopics: string[];
  suggestedSocialPerDay: number;
  suggestedEmailPerWeek: number;
  noteKey: (typeof MARKETING_OPTIMIZATION_NOTE_KEYS)[keyof typeof MARKETING_OPTIMIZATION_NOTE_KEYS];
};

/**
 * Heuristic tuning from recent rows (clicks + engagements + conversions).
 * Wire to admin UI or cron metadata later.
 */
type RecentRow = {
  topicKey: string | null;
  type: string;
  clicks: number;
  engagements: number;
  conversions: number;
};

export function suggestMarketingOptimization(recent: RecentRow[]): MarketingOptimizationHint {
  if (recent.length === 0) {
    return {
      boostTopics: ["market_update", "city_insights"],
      reduceTopics: [],
      suggestedSocialPerDay: 2,
      suggestedEmailPerWeek: 1,
      noteKey: MARKETING_OPTIMIZATION_NOTE_KEYS.noHistory,
    };
  }

  const score = (r: RecentRow) => r.clicks + r.engagements * 2 + r.conversions * 5;
  const byTopic = new Map<string, number>();
  for (const r of recent) {
    const k = r.topicKey ?? r.type;
    byTopic.set(k, (byTopic.get(k) ?? 0) + score(r));
  }
  const sorted = [...byTopic.entries()].sort((a, b) => b[1] - a[1]);
  const boostTopics = sorted.slice(0, 2).map(([k]) => k);
  const reduceTopics = sorted.slice(-2).filter(([k]) => !boostTopics.includes(k)).map(([k]) => k);

  const socialCount = recent.filter((r) => r.type === "social").length;
  const emailCount = recent.filter((r) => r.type === "email").length;
  const suggestedSocialPerDay = socialCount > 8 ? 1 : 2;
  const suggestedEmailPerWeek = emailCount > 4 ? 1 : 2;

  return {
    boostTopics,
    reduceTopics,
    suggestedSocialPerDay,
    suggestedEmailPerWeek,
    noteKey: MARKETING_OPTIMIZATION_NOTE_KEYS.weightedScores,
  };
}
