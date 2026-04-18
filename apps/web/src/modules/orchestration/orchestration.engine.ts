import { growthV3Flags } from "@/config/feature-flags";
import { evaluateUserLifecycle } from "@/src/modules/lifecycle/lifecycle.engine";
import { selectChannelsForUser, type ChannelPreferences } from "./channel.selector";
import { predictBestSendTime } from "./timing.optimizer";
import { computeFrequencyCaps } from "./frequency.controller";

export type OrchestrationPlan = {
  userId: string;
  channels: string[];
  bestSendHourUtc: number;
  sendConfidence: number;
  frequency: { maxEmailsPerWeek: number; maxPushPerWeek: number };
  explanation: string[];
};

/**
 * Produces a logged, explainable plan — does not enqueue sends.
 */
export async function buildOrchestrationPlan(
  userId: string,
  prefs: ChannelPreferences,
): Promise<OrchestrationPlan | null> {
  if (!growthV3Flags.orchestrationEngineV1) return null;

  const life = await evaluateUserLifecycle(userId);
  const stage = life?.stage ?? "explorer";
  const { channels, explanation: chExp } = selectChannelsForUser(stage, prefs);
  const timing = await predictBestSendTime(userId);
  const freq = computeFrequencyCaps(stage);

  return {
    userId,
    channels,
    bestSendHourUtc: timing.hourUtc,
    sendConfidence: timing.confidence,
    frequency: { maxEmailsPerWeek: freq.maxEmailsPerWeek, maxPushPerWeek: freq.maxPushPerWeek },
    explanation: [
      ...(life?.explanation.map((e) => `lifecycle: ${e}`) ?? ["lifecycle: default"]),
      ...chExp,
      ...timing.explanation,
      ...freq.explanation,
      "Outbound actions require approval policy + consent checks downstream.",
    ],
  };
}
