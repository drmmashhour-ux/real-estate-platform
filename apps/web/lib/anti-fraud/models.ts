/**
 * Anti-fraud risk levels and signal types.
 */

export type RiskLevel = "low" | "medium" | "high";

export type FraudSignal =
  | "duplicate_cadastre"
  | "cadastre_multiple_users"
  | "cadastre_different_cities"
  | "owner_name_mismatch"
  | "multiple_listings_new_account"
  | "unverified_identity"
  | "invalid_broker_license"
  | "broker_no_authorization_document"
  | "broker_suspicious_listings"
  | "low_document_confidence"
  | "missing_ownership_document"
  | "rapid_listing_creation"
  | "unusual_pricing"
  | "duplicate_address"
  | "duplicate_coordinates";

export type FraudReason = { signal: FraudSignal; points: number; detail?: string };

export const RISK_LEVELS: { max: number; level: RiskLevel }[] = [
  { max: 30, level: "low" },
  { max: 60, level: "medium" },
  { max: 100, level: "high" },
];

export function getRiskLevel(score: number): RiskLevel {
  for (const { max, level } of RISK_LEVELS) {
    if (score <= max) return level;
  }
  return "high";
}

export const FRAUD_SCORE_THRESHOLD_FREEZE = 70;
