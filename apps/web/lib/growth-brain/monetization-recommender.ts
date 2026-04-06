import type { BrainRecommendationDraft } from "./opportunity-detector";
import type { GrowthBrainSnapshot } from "./types";

/**
 * Monetization ideas — recommendations only; pricing changes require approval.
 */
export function recommendMonetization(snapshot: GrowthBrainSnapshot): BrainRecommendationDraft[] {
  const out: BrainRecommendationDraft[] = [];

  const ratio = snapshot.monetizationSignals.avgUnlockStartToSuccessRatio;
  if (ratio != null && ratio >= 0.35) {
    out.push({
      type: "unlock_price_test_candidate",
      domain: "revenue",
      priority: "medium",
      confidence: 0.53,
      title: "Unlock funnel shows completion — consider a scoped price test",
      description:
        "Sampled analytics suggest a non-trivial share of unlock starts complete. Any price change must be operator-approved and measured.",
      reasoning: `Observed success/start ratio in sampled rows ≈ ${(ratio * 100).toFixed(0)}%.`,
      suggestedAction: "Define A/B window, success metrics, and rollback — no automatic price changes.",
      autoRunnable: false,
      requiresApproval: true,
      targetEntityType: null,
      targetEntityId: null,
      metadataJson: { ratio },
    });
  }

  for (const b of snapshot.monetizationSignals.brokerHeavyCities.slice(0, 4)) {
    out.push({
      type: "broker_package_prompt",
      domain: "revenue",
      priority: "low",
      confidence: 0.48,
      title: `Broker activity in ${b.city}`,
      description:
        "Multiple broker-typed CRM leads detected — consider a packaged broker tier if product supports it.",
      reasoning: `Heuristic count of broker-role leads: ${b.brokerLeadHint}.`,
      suggestedAction: "Internal GTM review — do not auto-enroll users.",
      autoRunnable: false,
      requiresApproval: true,
      targetEntityType: "city",
      targetEntityId: b.city,
      metadataJson: { brokerLeadHint: b.brokerLeadHint },
    });
  }

  return out;
}
