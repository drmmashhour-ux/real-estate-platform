/**
 * Product clarity — deterministic advisory review (no runtime page scraping).
 */

import type { PlatformClarityReviewResult, PlatformClaritySurfaceReview } from "./platform-improvement.types";
import type { PlatformReviewSnapshot } from "./platform-review-snapshot";
import { getDefaultPlatformReviewSnapshot } from "./platform-review-snapshot";

function frictionBilling(s: PlatformReviewSnapshot): string[] {
  const out: string[] = [];
  if (!s.billingV1 && !s.subscriptionsV1) {
    out.push("Upgrade and subscription paths may be unclear when billing flags are off in this environment.");
  }
  if (s.demoMode) {
    out.push("Demo mode can dilute urgency — ensure production CTAs are validated separately.");
  }
  return out;
}

function improveTrust(s: PlatformReviewSnapshot): string[] {
  if (!s.trustIndicatorsV1) return ["Turn on trust indicators when ready so listing and host signals stay consistent."];
  return [];
}

export function buildPlatformClarityReview(
  snapshot: PlatformReviewSnapshot = getDefaultPlatformReviewSnapshot(),
): PlatformClarityReviewResult {
  const sharedFriction = frictionBilling(snapshot);
  const trustImp = improveTrust(snapshot);

  const surfaces: PlatformClaritySurfaceReview[] = [
    {
      surfaceId: "homepage",
      primaryPurpose: "Explain LECIPM value and route visitors to search, listings, or account creation.",
      primaryCta: "Start search · view listings · sign up",
      audience: "Buyers, sellers, curious visitors",
      frictionRisks: [...sharedFriction, "Homepage must not bury the primary search or listing entry."],
      suggestedImprovements: [
        "Keep one dominant hero CTA aligned with your current GTM (leads vs stays vs listings).",
        ...trustImp,
      ],
    },
    {
      surfaceId: "get_leads",
      primaryPurpose: "Capture and qualify demand for properties or services (broker / growth funnel).",
      primaryCta: "Submit lead · book call · save listing",
      audience: "High-intent buyers and renters",
      frictionRisks: [
        ...sharedFriction,
        "If growth machine is off, downstream follow-up promises in copy may not match automation.",
      ],
      suggestedImprovements: snapshot.growthMachineV1
        ? ["Align lead form fields with Growth Machine segments for cleaner routing."]
        : ["Tighten lead form to minimum viable fields until Growth Machine routing is enabled."],
    },
    {
      surfaceId: "listings",
      primaryPurpose: "Browse and compare inventory with ranking and filters.",
      primaryCta: "Open listing · save · contact",
      audience: "Active searchers",
      frictionRisks: [
        ...sharedFriction,
        snapshot.rankingV2
          ? "Ranking v2 on — ensure featured/boost rules stay transparent in UI copy."
          : "Ranking blend not fully on — users may see less personalized ordering.",
      ],
      suggestedImprovements: snapshot.featuredListingsV1
        ? ["Label featured placements clearly to protect trust."]
        : ["When enabling featured listings, add a visible “Featured” explanation."],
    },
    {
      surfaceId: "property_detail",
      primaryPurpose: "Convert interest into contact, booking, or next step with full listing context.",
      primaryCta: "Contact · schedule · save",
      audience: "Serious viewers",
      frictionRisks: [
        ...sharedFriction,
        "Detail pages fail when media, price, or availability drift — keep sync tight.",
      ],
      suggestedImprovements: snapshot.conversionOptimizationV1
        ? ["Use CRO nudges sparingly; keep one primary conversion path visible."]
        : ["Pick a single primary conversion action above the fold."],
    },
    {
      surfaceId: "bnhub_entry",
      primaryPurpose: "Enter BNHub stays flow: discover, book, pay with host trust signals.",
      primaryCta: "Search stays · view listing · checkout",
      audience: "Travelers and short-stay guests",
      frictionRisks: [
        ...sharedFriction,
        "Guests need fee and cancellation clarity before pay — avoid surprise at checkout.",
      ],
      suggestedImprovements: snapshot.hostAcquisitionV1
        ? ["Cross-link host acquisition story for supply-side confidence."]
        : ["Surface host verification and fee structure early in the funnel."],
    },
    {
      surfaceId: "broker_preview",
      primaryPurpose: "Give brokers a credible preview of pipeline, territories, or CRM value.",
      primaryCta: "Request access · book demo · view sample",
      audience: "Broker prospects and partner brokers",
      frictionRisks: [
        ...sharedFriction,
        snapshot.brokerAcquisitionV1
          ? []
          : "Broker acquisition surfaces may be thin — preview could over-promise automation.",
      ],
      suggestedImprovements: snapshot.brokerAcquisitionV1
        ? ["Tie preview copy to live broker acquisition metrics where possible."]
        : ["Keep broker preview factual; defer revenue claims until acquisition telemetry is wired."],
    },
  ];

  const notes = [
    "Review is flag-aware and static — validate copy on real pages before large campaigns.",
    snapshot.trustIndicatorsV1 ? "Trust badges available — ensure they map to real verification state." : "Enable trust indicators for consistent listing/host signaling when ready.",
  ];

  return { surfaces, notes };
}
