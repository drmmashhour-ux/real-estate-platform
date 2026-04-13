/**
 * Public “Mortgage broker platform” tiers (marketing + dashboard copy).
 * Internal routing / Stripe still uses basic | pro | premium | ambassador on ExpertSubscription.
 */

export type BrokerPlatformPlanSlug = "free" | "gold" | "platinum" | "ambassador";

/** Maps checkout + DB plan keys to partner-facing names. */
export const MORTGAGE_EXPERT_INTERNAL_PLANS = ["basic", "pro", "premium", "ambassador"] as const;
export type MortgageExpertInternalPlan = (typeof MORTGAGE_EXPERT_INTERNAL_PLANS)[number];

export type BrokerPlatformPlanCard = {
  slug: BrokerPlatformPlanSlug;
  title: string;
  subtitle: string;
  priceLabel: string;
  /** Shown on card */
  leadSummary: string;
  features: string[];
  /** null = no Stripe; use interest form only */
  internalPlan: MortgageExpertInternalPlan | null;
  requiresAccount: boolean;
  ctaLabel: string;
  /** Relative path or absolute */
  ctaHref: string;
  highlighted?: boolean;
};

export const BROKER_PLATFORM_PLANS: BrokerPlatformPlanCard[] = [
  {
    slug: "free",
    title: "Partner preview",
    subtitle: "Explore the program — no account required",
    priceLabel: "Free",
    leadSummary: "Program overview & limited actions (no lead inbox)",
    features: [
      "Downloadable partner overview & lead rules",
      "One-time platform intro call (scheduled by ops)",
      "No dashboard or automated lead routing",
    ],
    internalPlan: null,
    requiresAccount: false,
    ctaLabel: "Request program info",
    ctaHref: "#free-partner-form",
  },
  {
    slug: "gold",
    title: "Gold",
    subtitle: "Entry partner — steady flow",
    priceLabel: "From $49/mo",
    leadSummary: "Up to ~10 qualified leads / month · capped daily pace",
    features: [
      "Expert dashboard: assigned leads + contact workflow",
      "Directory listing on /mortgage & /experts",
      "Email notifications for new assignments",
    ],
    internalPlan: "basic",
    requiresAccount: true,
    ctaLabel: "Sign up & subscribe",
    ctaHref: "/auth/signup-expert?plan=gold",
  },
  {
    slug: "platinum",
    title: "Platinum",
    subtitle: "Growth brokers — higher volume",
    priceLabel: "From $99/mo",
    leadSummary: "Up to ~50 leads / month · routing priority over Gold",
    features: [
      "Everything in Gold",
      "Higher daily caps & marketplace unlock pool",
      "Priority placement in expert sort",
    ],
    internalPlan: "pro",
    requiresAccount: true,
    ctaLabel: "Sign up & subscribe",
    ctaHref: "/auth/signup-expert?plan=platinum",
    highlighted: true,
  },
  {
    slug: "ambassador",
    title: "Ambassador",
    subtitle: "Elite placement — maximum visibility",
    priceLabel: "From $299/mo",
    leadSummary: "Highest caps · first look at premium-intent leads",
    features: [
      "Everything in Platinum",
      "Featured expert treatment on public mortgage hub",
      "Eligible for high-intent (premium) auto-assignment pool",
    ],
    internalPlan: "ambassador",
    requiresAccount: true,
    ctaLabel: "Sign up & subscribe",
    ctaHref: "/auth/signup-expert?plan=ambassador",
  },
];

export function brokerPlatformPlanBySlug(slug: string): BrokerPlatformPlanCard | undefined {
  return BROKER_PLATFORM_PLANS.find((p) => p.slug === slug);
}

/** Human-readable name for expert billing / layout (internal plan key). */
export function mortgageExpertPlanDisplayName(internal: string): string {
  const p = internal.toLowerCase().trim();
  if (p === "ambassador") return "Ambassador";
  if (p === "premium") return "Platinum+";
  if (p === "pro") return "Platinum";
  if (p === "basic") return "Gold";
  return internal;
}
