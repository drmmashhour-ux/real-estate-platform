/**
 * Aggregate all fraud signals and compute score (0-100) and risk level.
 * Cap total at 100; apply risk level: 0-30 low, 31-60 medium, 61-100 high.
 */

import type { FraudReason, RiskLevel } from "../models";
import { getRiskLevel } from "../models";

export type ScoringResult = {
  fraudScore: number;
  riskLevel: RiskLevel;
  reasons: FraudReason[];
  alerts: { alertType: string; severity: string; message: string }[];
};

export function computeFraudScore(reasons: FraudReason[]): ScoringResult {
  let total = 0;
  const seen = new Set<string>();
  for (const r of reasons) {
    if (seen.has(r.signal)) continue;
    seen.add(r.signal);
    total += r.points;
  }
  const fraudScore = Math.min(100, total);
  const riskLevel = getRiskLevel(fraudScore);

  const alerts = reasons.map((r) => ({
    alertType: r.signal,
    severity: r.points >= 30 ? "high" : r.points >= 15 ? "medium" : "low",
    message: formatAlertMessage(r),
  }));

  return { fraudScore, riskLevel, reasons, alerts };
}

function formatAlertMessage(r: FraudReason): string {
  const messages: Record<string, string> = {
    duplicate_cadastre: "Cadastre number already used on another listing.",
    cadastre_multiple_users: "Cadastre number used by multiple users.",
    cadastre_different_cities: "Same cadastre number appears in a different city.",
    owner_name_mismatch: "Owner name on document does not match listing host.",
    multiple_listings_new_account: "New account with many listings.",
    unverified_identity: "Identity not verified.",
    invalid_broker_license: "Invalid broker license format.",
    broker_no_authorization_document: "Broker listing without authorization document.",
    broker_suspicious_listings: "Broker has multiple rejected or suspicious listings.",
    low_document_confidence: "Document AI confidence score is low.",
    missing_ownership_document: "Missing land register / ownership document.",
    rapid_listing_creation: "Many listings created in a short time.",
    unusual_pricing: "Listing price is far from market for this area.",
    duplicate_address: "Same or very similar address as another listing.",
    duplicate_coordinates: "Same coordinates as another listing.",
  };
  return (messages[r.signal] ?? r.signal) + (r.detail ? ` (${r.detail})` : "");
}
