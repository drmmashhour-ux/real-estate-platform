import type { VariantStats } from "./variantStats";

export type DailyInsightInput = {
  messagesSent: number;
  repliesReceived: number;
  callsBooked: number;
  variantStats: VariantStats;
  followUpDueCount: number;
};

function bestVariantByReplyRate(stats: VariantStats): { key: string; rate: number; uses: number } | null {
  let best: { key: string; rate: number; uses: number } | null = null;
  for (const [k, { uses, replies }] of Object.entries(stats)) {
    if (uses < 1) continue;
    const rate = replies / uses;
    if (!best || rate > best.rate) best = { key: k, rate, uses };
  }
  return best;
}

function labelForVariantKey(key: string): string {
  if (key === "curiosity") return "A (curiosity)";
  if (key === "problem_focused") return "B (problem-focused)";
  if (key === "direct_value") return "C (direct value)";
  return key;
}

/**
 * Short coaching lines from today’s logged numbers (no ML).
 */
export function generateDailyInsights(input: DailyInsightInput): string[] {
  const lines: string[] = [];
  const { messagesSent, repliesReceived, callsBooked, variantStats, followUpDueCount } = input;

  const replyRate = messagesSent > 0 ? repliesReceived / messagesSent : null;
  if (replyRate !== null && messagesSent >= 5 && replyRate < 0.08) {
    lines.push("Reply rate is low — tighten your opening line or test another script variant.");
  }

  if (followUpDueCount > 0) {
    lines.push(`Follow-ups missing: ${followUpDueCount} lead(s) contacted 24h+ ago with no reply logged — send a gentle nudge (you copy/paste).`);
  }

  const best = bestVariantByReplyRate(variantStats);
  if (best && best.uses >= 2 && best.rate > 0) {
    lines.push(`${labelForVariantKey(best.key)} is leading on replies vs uses — double down if it fits your voice.`);
  }

  if (messagesSent >= 3 && repliesReceived > 0 && callsBooked === 0) {
    lines.push("Replies but no calls booked yet — use the reply-to-call script and offer two time windows.");
  }

  if (lines.length === 0) {
    lines.push("Keep logging sends and replies so this panel can spot what’s working.");
  }

  return lines;
}
