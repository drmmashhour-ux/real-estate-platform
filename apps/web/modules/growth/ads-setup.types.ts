export type AdSetupPlan = {
  platform: "facebook";
  budgetTotal: number;
  dailyBudget: number;
  durationDays: number;
  targeting: string[];
  /** Primary text for the ad body (human paste into Ads Manager). */
  copy: string;
  /** Suggested CTA button label. */
  cta: string;
};
