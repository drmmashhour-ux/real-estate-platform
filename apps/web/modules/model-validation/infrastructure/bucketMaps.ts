/** Trust buckets align with UI bands: critical | caution | strong | verified */

export type TrustBucket = "critical" | "caution" | "strong" | "verified";

export function trustBucketFromScore(score: number | null): TrustBucket | null {
  if (score == null || Number.isNaN(score)) return null;
  if (score >= 85) return "verified";
  if (score >= 65) return "strong";
  if (score >= 40) return "caution";
  return "critical";
}

const TRUST_ALIASES: Record<string, TrustBucket> = {
  critical: "critical",
  low: "critical",
  bad: "critical",
  untrustworthy: "critical",
  not_trustworthy: "critical",
  caution: "caution",
  medium: "caution",
  fair: "caution",
  mixed: "caution",
  strong: "strong",
  high: "strong",
  good: "strong",
  trustworthy: "strong",
  verified: "verified",
  elite: "verified",
};

export function normalizeHumanTrustLabel(raw: string | null | undefined): TrustBucket | null {
  if (raw == null) return null;
  const k = raw.trim().toLowerCase().replace(/\s+/g, "_");
  return TRUST_ALIASES[k] ?? null;
}

/** Deal buckets for calibration */
export type DealBucket = "negative" | "caution" | "review" | "strong";

export function dealBucketFromRecommendation(rec: string | null): DealBucket | null {
  if (rec == null) return null;
  const r = rec.trim().toLowerCase();
  if (r === "avoid" || r === "insufficient_data") return "negative";
  if (r === "caution") return "caution";
  if (r === "worth_reviewing") return "review";
  if (r === "strong_opportunity") return "strong";
  return null;
}

const DEAL_ALIASES: Record<string, DealBucket> = {
  negative: "negative",
  avoid: "negative",
  weak: "negative",
  bad: "negative",
  poor: "negative",
  caution: "caution",
  review: "review",
  moderate: "review",
  neutral: "review",
  ok: "review",
  fair: "review",
  strong: "strong",
  opportunity: "strong",
  attractive: "strong",
};

export function normalizeHumanDealLabel(raw: string | null | undefined): DealBucket | null {
  if (raw == null) return null;
  const k = raw.trim().toLowerCase().replace(/\s+/g, "_");
  return DEAL_ALIASES[k] ?? null;
}

/** Risk buckets: low | medium | high */
export type RiskBucket = "low" | "medium" | "high";

export function fraudBucketFromScore(score: number | null): RiskBucket | null {
  if (score == null || Number.isNaN(score)) return null;
  if (score >= 65) return "high";
  if (score >= 40) return "medium";
  return "low";
}

const RISK_ALIASES: Record<string, RiskBucket> = {
  low: "low",
  clear: "low",
  safe: "low",
  medium: "medium",
  med: "medium",
  moderate: "medium",
  high: "high",
  critical: "high",
  escalate: "high",
};

export function normalizeHumanRiskLabel(raw: string | null | undefined): RiskBucket | null {
  if (raw == null) return null;
  const k = raw.trim().toLowerCase().replace(/\s+/g, "_");
  return RISK_ALIASES[k] ?? null;
}
