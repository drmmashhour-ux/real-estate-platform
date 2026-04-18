/**
 * Conservative thresholds for learning control (advisory gating only).
 */

/** Above this negative outcome share → freeze recommended. */
export const GGL_MAX_NEGATIVE_RATE = 0.6;

/** Above this insufficient-data share → freeze or monitor (see decision service). */
export const GGL_MAX_INSUFFICIENT_DATA_RATE = 0.5;

/** At or beyond this drift from neutral weights → reset recommended (human revert). */
export const GGL_MAX_WEIGHT_DRIFT = 0.25;

/** Label when governance implies high operational risk. */
export const GGL_HIGH_RISK_GOVERNANCE_LEVEL = "high";

/** Cumulative autopilot execution failures above this → freeze recommended. */
export const GGL_MAX_EXECUTION_ERRORS = 3;

/** Minimum evaluated signals before treating rates as reliable. */
export const GGL_MIN_SIGNALS_REQUIRED = 5;
