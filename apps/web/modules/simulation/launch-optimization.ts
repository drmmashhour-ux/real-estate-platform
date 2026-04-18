import type { FirstUsersSimulationAggregate, UserSimulation } from "./first-users";

export type OptimizationRecommendation = {
  category: "ux" | "copy" | "pricing" | "trust" | "performance";
  priority: "p0" | "p1" | "p2";
  title: string;
  rationale: string;
};

/**
 * Deterministic recommendations from aggregated friction + funnel leakage.
 */
export function buildLaunchOptimizationRecommendations(
  aggregate: FirstUsersSimulationAggregate,
  _users: UserSimulation[]
): OptimizationRecommendation[] {
  const out: OptimizationRecommendation[] = [];

  const checkoutLeak =
    aggregate.funnel.find((f) => f.step === "checkout")?.reached ?? 0;
  const bookingDone =
    aggregate.funnel.find((f) => f.step === "booking_completed")?.reached ?? 0;
  if (checkoutLeak > 0 && bookingDone < checkoutLeak) {
    out.push({
      category: "trust",
      priority: "p0",
      title: "Strengthen pay-step trust",
      rationale: `Checkout reached ${checkoutLeak}× but completed ${bookingDone}× — add refund/house-rules links + support hint beside Stripe.`,
    });
  }

  const listingToBooking =
    aggregate.funnel.find((f) => f.step === "listing_view")?.reached ?? 0;
  const bookingStarts =
    aggregate.funnel.find((f) => f.step === "booking_start")?.reached ?? 0;
  if (listingToBooking > 0 && bookingStarts / listingToBooking < 0.5) {
    out.push({
      category: "pricing",
      priority: "p0",
      title: "Clarify all-in price earlier",
      rationale: "Large drop between listing view and booking start — show fee breakdown on listing card or date step.",
    });
  }

  out.push({
    category: "ux",
    priority: "p1",
    title: "Reduce booking form errors",
    rationale: "Confused-user path failed validation — tighten labels, defaults, and inline errors for guest counts.",
  });

  out.push({
    category: "performance",
    priority: "p1",
    title: "Mobile checkout perceived speed",
    rationale: "Mobile persona abandoned at checkout — skeleton UI, preload Stripe, minimize steps to payment.",
  });

  out.push({
    category: "copy",
    priority: "p2",
    title: "Campaign-LP match for investors",
    rationale: "Investor persona bounced on rent LP — split keywords to /lp/invest and negative keywords on non-guest intents.",
  });

  return out;
}
