import { generateGrowthHypotheses } from "./hypothesis.engine";
import { ChannelScore, GrowthChannel } from "./growth.types";
import { logInfo } from "@/lib/logger";

const TAG = "[growth-engine]";

/**
 * Scores and prioritizes channels based on generated hypotheses and confidence.
 */
export async function prioritizeGrowthChannels(): Promise<ChannelScore[]> {
  const hypotheses = await generateGrowthHypotheses();
  const scores: Partial<Record<GrowthChannel, { score: number; count: number; rationale: string[] }>> = {};

  for (const h of hypotheses) {
    const current = scores[h.channel] || { score: 0, count: 0, rationale: [] };
    current.score += h.confidence * (h.riskLevel === "LOW" ? 1.2 : h.riskLevel === "MEDIUM" ? 1 : 0.8);
    current.count += 1;
    current.rationale.push(h.hypothesis);
    scores[h.channel] = current;
  }

  const prioritized: ChannelScore[] = Object.entries(scores).map(([channel, data]) => {
    const avgScore = data!.score / data!.count;
    return {
      channel: channel as GrowthChannel,
      score: Math.min(10, avgScore * 10),
      rationale: data!.rationale.join(" "),
      allocationRecommendation: avgScore > 0.7 ? "INCREASE_EFFORT" : "MAINTAIN",
    };
  });

  const sorted = prioritized.sort((a, b) => b.score - a.score);
  logInfo(`${TAG} channel_prioritized`, { topChannel: sorted[0]?.channel });
  
  return sorted;
}
