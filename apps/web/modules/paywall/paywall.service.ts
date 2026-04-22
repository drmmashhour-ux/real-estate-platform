/**
 * Primary paywall façade — delegates to entitlement composition in `paywall-gate.service`.
 */

import type { PaywallDecision, PaywallFeature } from "./paywall.types";
import { evaluatePaywall } from "./paywall-gate.service";

/** @deprecated Use evaluatePaywall — alias for older call sites */
export async function checkFeatureAccess(userId: string, feature: PaywallFeature): Promise<PaywallDecision> {
  return evaluatePaywall(userId, feature);
}

export async function resolvePaywall(userId: string, feature: PaywallFeature): Promise<PaywallDecision> {
  return evaluatePaywall(userId, feature);
}

export type { PaywallDecision, PaywallFeature };
