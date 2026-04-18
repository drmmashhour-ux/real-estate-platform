/**
 * LECIPM Launch + Fraud Protection System v1 — first-user acquisition plan (static strategy).
 * Does not spend budget; outputs a structured plan for ops/marketing.
 */

export type LaunchChannel = {
  id: string;
  name: string;
  budgetCents: number;
  budgetPct: number;
  description: string;
};

export type LaunchStrategyPlan = {
  version: "LECIPM Launch + Fraud Protection System v1";
  cohortLabel: string;
  targetUserCount: number;
  budgetMinCents: number;
  budgetMaxCents: number;
  channels: LaunchChannel[];
  expectedUsers: { channelId: string; users: number; rationale: string }[];
  costPerUser: { channelId: string; estimatedCacCents: number | null; note: string }[];
  timeline: { week: number; focus: string; milestones: string[] }[];
  actions: { priority: number; title: string; owner: string; detail: string }[];
  /** Derived for dashboards */
  avgBudgetCents?: number;
};

/** Default $100–$500 CAD envelope for first 50 users (paid + organic blend). */
export function generateFirstUsersLaunchStrategy(
  opts?: { targetUsers?: number; budgetMinCents?: number; budgetMaxCents?: number }
): LaunchStrategyPlan {
  const targetUserCount = Math.min(200, Math.max(10, opts?.targetUsers ?? 50));
  const budgetMinCents = opts?.budgetMinCents ?? 10_000;
  const budgetMaxCents = opts?.budgetMaxCents ?? 50_000;

  const channels: LaunchChannel[] = [
    {
      id: "google_ads_mtl",
      name: "Google Ads (Montreal + BNHUB intent)",
      budgetCents: Math.round(budgetMaxCents * 0.35),
      budgetPct: 35,
      description: "Search campaigns: furnished rental, short stay, corporate stay — geo Montreal + Laval.",
    },
    {
      id: "facebook_groups",
      name: "Facebook groups (housing / newcomers)",
      budgetCents: Math.round(budgetMaxCents * 0.15),
      budgetPct: 15,
      description: "Sponsored posts + authentic host stories in Montreal housing and newcomer groups.",
    },
    {
      id: "direct_outreach",
      name: "Direct outreach (DM / email)",
      budgetCents: Math.round(budgetMaxCents * 0.2),
      budgetPct: 20,
      description: "Warm intros to 20–40 potential hosts; track in CRM with UTM.",
    },
    {
      id: "broker_network",
      name: "Broker & relocation network",
      budgetCents: Math.round(budgetMaxCents * 0.15),
      budgetPct: 15,
      description: "Referral fees or co-marketing with brokers who place relocating clients.",
    },
    {
      id: "organic_product",
      name: "Organic + product-led",
      budgetCents: Math.round(budgetMaxCents * 0.15),
      budgetPct: 15,
      description: "SEO landing pages, waitlist, and in-app referral — no direct media spend.",
    },
  ];

  const expectedUsers = [
    { channelId: "google_ads_mtl", users: Math.ceil(targetUserCount * 0.28), rationale: "Paid search intent; CAC sensitive to creative." },
    { channelId: "facebook_groups", users: Math.ceil(targetUserCount * 0.18), rationale: "Community trust; slower but high relevance." },
    { channelId: "direct_outreach", users: Math.ceil(targetUserCount * 0.14), rationale: "Fewer users, higher host quality." },
    { channelId: "broker_network", users: Math.ceil(targetUserCount * 0.12), rationale: "B2B2C; depends on partner bandwidth." },
    { channelId: "organic_product", users: Math.ceil(targetUserCount * 0.28), rationale: "Long tail; fills funnel when ads are paused." },
  ];

  const avgBudget = (budgetMinCents + budgetMaxCents) / 2;
  const costPerUser = channels.map((c) => {
    const eu = expectedUsers.find((e) => e.channelId === c.id)?.users ?? 1;
    const est = Math.round(c.budgetCents / Math.max(1, eu));
    return {
      channelId: c.id,
      estimatedCacCents: eu > 0 ? est : null,
      note:
        c.id === "organic_product"
          ? "CAC not meaningful — attribute via last-touch in analytics."
          : `Based on ${eu} expected users from channel mix.`,
    };
  });

  const timeline = [
    {
      week: 1,
      focus: "Inventory + tracking",
      milestones: ["UTM taxonomy live", "First 5 published stays", "Fraud + funnel dashboards reviewed"],
    },
    {
      week: 2,
      focus: "Soft traffic",
      milestones: ["Google Ads $20–40/day cap", "2–3 group posts", "10 broker intros scheduled"],
    },
    {
      week: 3,
      focus: "Scale winners",
      milestones: ["Pause underperforming ad sets", "Double down on CAC < target", "Host onboarding fixes"],
    },
    {
      week: 4,
      focus: "Retention",
      milestones: ["First-booking email sequence", "Review fraud flags", "Referral prompt to happy guests"],
    },
  ];

  const actions = [
    {
      priority: 1,
      title: "Verify analytics + fraud logging",
      owner: "Engineering",
      detail: "Ensure /api/analytics/track and fraud_events are receiving production traffic before scaling spend.",
    },
    {
      priority: 2,
      title: "Creative + LP alignment",
      owner: "Growth",
      detail: "Match ad copy to BNHUB value props; landing_view → booking_started funnel in admin/launch.",
    },
    {
      priority: 3,
      title: "Broker pilot agreements",
      owner: "Partnerships",
      detail: "Define referral or co-brand terms with 3 broker offices minimum.",
    },
  ];

  return {
    version: "LECIPM Launch + Fraud Protection System v1",
    cohortLabel: `First ${targetUserCount} users (LECIPM)`,
    targetUserCount,
    budgetMinCents,
    budgetMaxCents,
    channels,
    expectedUsers,
    costPerUser,
    timeline,
    actions,
    avgBudgetCents: avgBudget,
  };
}
