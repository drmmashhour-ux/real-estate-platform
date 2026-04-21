import { logInfo } from "@/lib/logger";
import type { SentimentLabel } from "@/modules/messaging/analysis/sentiment.detector";

const TAG = "[deal-prediction]";

export type EngagementFeatures = {
  avgResponseMinutes: number | null;
  messagesPerDay: number;
  totalMessages: number;
};

export function computeEngagementScore(f: EngagementFeatures): number {
  let s = 40;
  if (f.totalMessages >= 8) s += 20;
  else if (f.totalMessages >= 4) s += 12;
  else if (f.totalMessages >= 2) s += 6;

  if (f.messagesPerDay >= 4) s += 18;
  else if (f.messagesPerDay >= 2) s += 10;
  else if (f.messagesPerDay >= 0.5) s += 5;

  if (f.avgResponseMinutes != null) {
    if (f.avgResponseMinutes <= 60) s += 22;
    else if (f.avgResponseMinutes <= 240) s += 12;
    else if (f.avgResponseMinutes <= 1440) s += 5;
    else s -= 5;
  }

  return Math.max(0, Math.min(100, Math.round(s)));
}

export function estimateDealProbability(params: {
  sentiment: SentimentLabel;
  engagementScore: number;
  signals: { interest: boolean; hesitation: boolean; objections: boolean };
}): number {
  let p = params.engagementScore * 0.45;

  if (params.sentiment === "POSITIVE") p += 22;
  else if (params.sentiment === "NEGATIVE") p -= 25;
  else p += 6;

  if (params.signals.interest) p += 12;
  if (params.signals.hesitation) p -= 6;
  if (params.signals.objections) p -= 10;

  const result = Math.max(5, Math.min(92, Math.round(p)));
  logInfo(`${TAG} estimate`, { dealProbability: result });
  return result;
}
