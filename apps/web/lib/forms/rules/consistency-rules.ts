import type { RuleEngineResult } from "../types";

export function runConsistencyRules(
  fieldValues: Record<string, unknown>,
  listingPriceCents?: number | null
): RuleEngineResult {
  const alerts: RuleEngineResult["alerts"] = [];
  const offer = fieldValues.purchase_price_cents;
  if (
    listingPriceCents != null &&
    typeof offer === "number" &&
    Math.abs(offer - listingPriceCents) > 1 &&
    offer > 0
  ) {
    alerts.push({
      severity: "high",
      alertType: "inconsistency",
      title: "Listing price and drafted amount do not match",
      body: `Listing shows ${(listingPriceCents / 100).toFixed(2)} CAD; purchase_price_cents is ${(offer / 100).toFixed(2)} CAD. Confirm intentional deviation.`,
      sourceType: "rule_engine",
      sourceRef: "consistency_rules",
    });
  }
  return { alerts, details: { consistencyRules: true } };
}
