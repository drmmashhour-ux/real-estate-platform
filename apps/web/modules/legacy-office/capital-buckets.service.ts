/**
 * Capital sleeve labels for stewardship tracking — informational only. Not tax or accounting advice.
 */

export const LEGACY_CAPITAL_BUCKET_KEYS = [
  "OPERATING_CAPITAL",
  "INVESTMENT_CAPITAL",
  "RESERVE_CAPITAL",
  "PHILANTHROPIC_CAPITAL",
  "FAMILY_CAPITAL",
] as const;

export type LegacyCapitalBucketKey = (typeof LEGACY_CAPITAL_BUCKET_KEYS)[number];

export type LegacyCapitalBucket = {
  key: LegacyCapitalBucketKey;
  label: string;
  /** User notes on purpose, policy, or constraints. */
  notes?: string | null;
  /** Optional book / planning amount in minor units — self-reported. */
  amountCents?: number | null;
};

export const DEFAULT_LEGACY_CAPITAL_BUCKET_LABELS: Record<LegacyCapitalBucketKey, string> = {
  OPERATING_CAPITAL: "Operating capital",
  INVESTMENT_CAPITAL: "Investment capital",
  RESERVE_CAPITAL: "Reserve capital",
  PHILANTHROPIC_CAPITAL: "Philanthropic capital",
  FAMILY_CAPITAL: "Family capital",
};

export function createDefaultCapitalBuckets(): LegacyCapitalBucket[] {
  return LEGACY_CAPITAL_BUCKET_KEYS.map((key) => ({
    key,
    label: DEFAULT_LEGACY_CAPITAL_BUCKET_LABELS[key],
    notes: "",
    amountCents: null,
  }));
}

export function totalCapitalCents(buckets: LegacyCapitalBucket[]): number {
  return buckets.reduce((s, b) => s + (b.amountCents ?? 0), 0);
}
