import type { ContentStrategyHints, PerformanceMetrics } from "@/src/modules/ai-growth-engine/domain/growth.types";

/**
 * Lightweight heuristic optimizer — no black-box ML. Safe to test deterministically.
 */
export function optimizeContentStrategy(args: {
  recent: { topic: string; metrics: PerformanceMetrics }[];
}): ContentStrategyHints {
  if (!args.recent.length) {
    return {
      emphasizeTopics: ["trust", "local market"],
      avoidTopics: [],
      preferredFormats: ["short_post", "blog"],
      rationale: "Insufficient data — default to education and trust pillars.",
    };
  }

  const score = (m: PerformanceMetrics) => m.engagement * 2 + m.clicks + m.views / 1000;
  const sorted = [...args.recent].sort((a, b) => score(b.metrics) - score(a.metrics));
  const top = sorted.slice(0, Math.min(3, sorted.length)).map((x) => x.topic);
  const bottom = sorted.length > 1 ? [sorted[sorted.length - 1]!.topic] : [];

  return {
    emphasizeTopics: top,
    avoidTopics: bottom,
    preferredFormats:
      sorted[0] && score(sorted[0].metrics) > 10 ? ["video_script", "short_post"] : ["blog", "email"],
    rationale: "Ranked by engagement + clicks + scaled views; deprioritize lowest performers.",
  };
}
