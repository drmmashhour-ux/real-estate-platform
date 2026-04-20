/**
 * Deterministic thresholds for certificate-of-location V2 heuristics — not legal validity.
 */
export const CERTIFICATE_LOCATION_V2_CONFIG = {
  /** Age beyond which certificate is flagged as potentially outdated (warning semantics only). */
  outdatedAgeDaysWarning: 365,
  /** Stronger staleness threshold for elevated signals. */
  outdatedAgeDaysStrong: 730,
} as const;
