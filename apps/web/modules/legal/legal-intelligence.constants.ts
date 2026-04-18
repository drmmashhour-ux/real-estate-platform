/**
 * Deterministic thresholds for Legal Intelligence (no ML).
 * Tune via env only where noted; defaults are conservative.
 */

export const LEGAL_INTEL_DEFAULT_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

/** Duplicate uploads: same normalized name + mime within listing. */
export const DUPLICATE_DOCUMENT_MIN_COUNT = 3;
export const DUPLICATE_DOCUMENT_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

/** Identity verification overlap: distinct open-ish cases same subject area. */
export const DUPLICATE_IDENTITY_MIN_CASES = 2;

/** Reject loop proxy: rejected supporting docs vs very recent uploads. */
export const SUSPICIOUS_RESUBMISSION_REJECTED_MIN = 3;
export const SUSPICIOUS_RESUBMISSION_CREATED_MIN = 5;

/** Rejection ratio for supporting docs in window (deterministic). */
export const HIGH_REJECTION_RATE_MIN_REJECTED = 4;
export const HIGH_REJECTION_RATE_RATIO_THRESHOLD = 0.45;

/** Critical slots missing together (ownership + id_proof typical). */
export const MISSING_CLUSTER_MIN_MISSING = 2;

/** Same filename pattern across unrelated listings (same user). */
export const CROSS_ENTITY_FILENAME_MIN_LISTINGS = 2;

/** Metadata heuristics. */
export const METADATA_LONG_NAME_CHARS = 180;

/** Review queues — hours without state change while awaiting review. */
export const REVIEW_DELAY_SLOT_HOURS = 72;
export const REVIEW_DELAY_SUPPORTING_HOURS = 48;
export const REVIEW_DELAY_VERIFICATION_HOURS = 96;

/** Burst uploads in short interval. */
export const SUBMISSION_BURST_WINDOW_MS = 2 * 60 * 60 * 1000;
export const SUBMISSION_BURST_MIN_COUNT = 8;

/** Policy / governance — counts for escalation-style rules. */
export const POLICY_CRITICAL_SIGNAL_THRESHOLD = 2;
export const POLICY_REPEATED_CROSS_ENTITY_THRESHOLD = 2;
