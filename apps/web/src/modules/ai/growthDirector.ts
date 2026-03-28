import { getBestChannels, type ChannelStat } from "@/src/modules/ai/growthEngine";

export type ScalingHint = {
  channel: string;
  action: "increase" | "maintain" | "hold";
  rationale: string;
};

/**
 * Identify strongest acquisition channels from CRM lead attribution.
 */
export async function detectBestChannels(days = 30, limit = 10): Promise<ChannelStat[]> {
  return getBestChannels(days, limit);
}

/**
 * Turn channel rankings into scaling recommendations (rules — not ad API spend).
 */
export function recommendScalingActions(channels: ChannelStat[]): ScalingHint[] {
  if (!channels.length) {
    return [
      {
        channel: "direct",
        action: "hold",
        rationale: "Insufficient channel data — default to product SEO + CRM nurture",
      },
    ];
  }
  const [top, second] = channels;
  const hints: ScalingHint[] = [];
  if (top && top.leads >= 5) {
    hints.push({
      channel: top.channel,
      action: "increase",
      rationale: `Top channel "${top.channel}" (${top.leads} leads) — increase budget / creative tests`,
    });
  }
  if (second && second.leads >= 3 && top && top.channel !== second.channel) {
    hints.push({
      channel: second.channel,
      action: "maintain",
      rationale: `Secondary "${second.channel}" (${second.leads}) — maintain while scaling winner`,
    });
  }
  return hints.length ? hints : [{ channel: top!.channel, action: "maintain", rationale: "Single-channel focus" }];
}
