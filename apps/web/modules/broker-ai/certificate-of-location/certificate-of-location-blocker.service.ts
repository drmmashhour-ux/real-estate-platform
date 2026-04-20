/**
 * Publish / offer / broker-review impact hints — advisory only; no mutations.
 */

import { brokerAiFlags } from "@/config/feature-flags";
import type { CertificateOfLocationSummary } from "./certificate-of-location.types";

export type CertificateOfLocationBlockerImpact = {
  affectsPublish: boolean;
  affectsOfferReadiness: boolean;
  affectsBrokerReview: boolean;
  reasons: string[];
};

export function getCertificateOfLocationBlockerImpact(summary: CertificateOfLocationSummary): CertificateOfLocationBlockerImpact {
  try {
    const reasons: string[] = [];
    let affectsPublish = false;
    let affectsOfferReadiness = false;
    let affectsBrokerReview = false;

    const blockerOn = brokerAiFlags.brokerAiCertificateBlockerV1 === true;

    if (summary.blockingIssues.length > 0) {
      affectsBrokerReview = true;
      for (const b of summary.blockingIssues.slice(0, 6)) {
        if (!reasons.includes(b)) reasons.push(b);
      }
    }

    if (summary.status === "missing") {
      affectsBrokerReview = true;
      if (!reasons.includes("certificate_of_location_missing")) reasons.push("certificate_of_location_missing");
      if (blockerOn) {
        affectsPublish = true;
        if (!reasons.includes("publish_readiness_certificate_missing")) {
          reasons.push("publish_readiness_certificate_missing");
        }
      }
    }

    if (summary.status === "needs_review" || summary.status === "rejected") {
      affectsBrokerReview = true;
      if (!reasons.includes("certificate_review_required")) reasons.push("certificate_review_required");
    }

    if (summary.status === "may_be_outdated" || summary.readinessLevel === "review_required") {
      affectsOfferReadiness = true;
      if (!reasons.includes("offer_readiness_manual_review_recommended")) {
        reasons.push("offer_readiness_manual_review_recommended");
      }
    }

    if (summary.warnings.some((w) => w.includes("broker") || w.includes("offer"))) {
      affectsBrokerReview = true;
    }

    const sortedReasons = [...reasons].sort((a, b) => a.localeCompare(b));

    return {
      affectsPublish,
      affectsOfferReadiness,
      affectsBrokerReview,
      reasons: sortedReasons,
    };
  } catch {
    return {
      affectsPublish: false,
      affectsOfferReadiness: false,
      affectsBrokerReview: false,
      reasons: ["blocker_impact_fallback"],
    };
  }
}
