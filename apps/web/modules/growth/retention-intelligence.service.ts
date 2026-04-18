/**
 * Retention intelligence — churn/inactivity signals + suggested plays (operator-run campaigns only).
 */

import { getBrokerLifecycleSnapshots, type BrokerLifecycleRow } from "./lifecycle.service";

export type RetentionIntelligenceSnapshot = {
  atRisk: BrokerLifecycleRow[];
  reactivationPlays: string[];
  incentiveSuggestions: string[];
};

export async function getRetentionIntelligence(): Promise<RetentionIntelligenceSnapshot> {
  const rows = await getBrokerLifecycleSnapshots(50);
  const atRisk = rows.filter((r) => r.churnRisk === "high" || r.stage === "at_risk");

  const reactivationPlays: string[] = [
    "Segment at-risk brokers — send masked lead + limited-time unlock credit (manual approval).",
    "Run win-back office-hours webinar for inactive 45d+ with prior purchases.",
    "A/B subject lines for personal outreach; no automated bulk email without compliance review.",
  ];

  const incentiveSuggestions: string[] = [
    "Volume rebate review for Elite tier after 3 consecutive active months.",
    "Refer-a-broker credit (track via existing referral codes).",
    "Seasonal boost: featured placement in broker directory (product flag).",
  ];

  return { atRisk, reactivationPlays, incentiveSuggestions };
}
