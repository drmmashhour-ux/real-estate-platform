export type LaunchWave = {
  wave: number;
  focus: string;
  checklist: string[];
};

/** Ordered rollout checklist — operational, not performance guarantees. */
export function buildMontrealLaunchSequence(primaryZones: string[]): LaunchWave[] {
  const focus = primaryZones.slice(0, 3).join(", ") || "Core Montréal corridors";
  return [
    {
      wave: 1,
      focus,
      checklist: [
        "Verify host identity + listing disclosures (Québec)",
        "Stripe Connect readiness for BNHub payouts",
        "Consent logs for any outbound messaging",
      ],
    },
    {
      wave: 2,
      focus: "Referral + save/share loops (rate-limited)",
      checklist: [
        "Enable referral credits per program rules",
        "Track referral events for fraud patterns",
      ],
    },
    {
      wave: 3,
      focus: "Broker + resale cross-sell (opt-in)",
      checklist: [
        "Broker onboarding session",
        "Separate CRM attribution for resale vs stays",
      ],
    },
  ];
}
