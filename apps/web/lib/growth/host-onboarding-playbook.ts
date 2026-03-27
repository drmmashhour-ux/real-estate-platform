/**
 * Guided host onboarding + listing activation — ops checklist and product hooks.
 * Wire steps in host dashboard over time; this module is the single source for copy and order.
 */

export type HostOnboardingStep = {
  id: string;
  title: string;
  description: string;
  route?: string;
  auto?: boolean;
};

export const HOST_ONBOARDING_FLOW: HostOnboardingStep[] = [
  {
    id: "verify",
    title: "Verify identity",
    description: "Unlock payouts and trust badges.",
    route: "/bnhub/verify-id",
  },
  {
    id: "listing_draft",
    title: "Create listing draft",
    description: "Address, photos, amenities — save as draft anytime.",
    route: "/bnhub/host/dashboard",
  },
  {
    id: "pricing",
    title: "Set nightly price",
    description: "Use suggested range from comps; adjust for seasonality.",
    route: "/bnhub/host/pricing",
    auto: false,
  },
  {
    id: "calendar",
    title: "Open calendar",
    description: "Minimum stay and availability — required before publish.",
    route: "/bnhub/host/dashboard",
  },
  {
    id: "submit_review",
    title: "Submit for review",
    description: "Compliance check; fix blockers if any.",
    route: "/host/bnhub/verification",
  },
  {
    id: "publish",
    title: "Go live",
    description: "PUBLISHED status — appears in search and ads landing pages.",
    auto: true,
  },
];

/** Simple anchor price from market median (caller passes comps median in cents). */
export function suggestNightlyPriceCents(medianPeerCents: number, qualityTier: "economy" | "standard" | "premium") {
  const mult = qualityTier === "economy" ? 0.92 : qualityTier === "premium" ? 1.08 : 1;
  return Math.max(1000, Math.round(medianPeerCents * mult));
}
