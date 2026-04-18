import { buildChannelPerformance } from "./channel-performance.service";
import { buildWeeklySignupCohorts } from "./cohort-analysis.service";
import { buildRetentionPulse } from "./retention-analysis.service";
import { buildFullFunnelBundle } from "@/modules/growth-funnel/funnel.service";

export type ScalingGrowthBundle = {
  generatedAt: string;
  channels: Awaited<ReturnType<typeof buildChannelPerformance>>;
  cohorts: Awaited<ReturnType<typeof buildWeeklySignupCohorts>>;
  retention: Awaited<ReturnType<typeof buildRetentionPulse>>;
  funnels: Awaited<ReturnType<typeof buildFullFunnelBundle>>;
  recommendedScalingActions: string[];
};

/**
 * What to scale next — inferred from weakest funnel step + channel mix (no fabricated uplift).
 */
export async function buildScalingGrowthBundle(): Promise<ScalingGrowthBundle> {
  const [channels, cohorts, retention, funnels] = await Promise.all([
    buildChannelPerformance(90),
    buildWeeklySignupCohorts(12),
    buildRetentionPulse(90),
    buildFullFunnelBundle(),
  ]);

  const actions: string[] = [];
  const guestFirst = funnels.guest.steps[0]?.count ?? 0;
  const guestLast = funnels.guest.steps[funnels.guest.steps.length - 1]?.count ?? 0;
  if (guestFirst > 10 && guestLast === 0) {
    actions.push("Guest funnel shows views but no completions — inspect payment/booking completion tracking.");
  }
  if (!channels.bestChannelBySignups && channels.channels.every((c) => c.signups90d === 0)) {
    actions.push("No signup channel attribution in 90d — tighten UTM and src query capture on signup.");
  }
  if (cohorts.rows.length >= 4 && cohorts.rows.slice(-4).every((r) => r.signups === 0)) {
    actions.push("Recent weekly cohorts are flat — validate acquisition loops before paid scale.");
  }
  if (actions.length === 0) {
    actions.push("Review funnel drop-offs and double down on the best attributed channel with compliant creatives.");
  }

  return {
    generatedAt: new Date().toISOString(),
    channels,
    cohorts,
    retention,
    funnels,
    recommendedScalingActions: actions,
  };
}
