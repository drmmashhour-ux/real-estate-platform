/**
 * Exit pathway labels for planning workflows only.
 * Not a prediction of outcomes, valuation, or timing.
 */

export const ACQUISITION = "ACQUISITION" as const;
export const IPO = "IPO" as const;

export const EXIT_TYPES = [ACQUISITION, IPO] as const;

export type ExitType = (typeof EXIT_TYPES)[number];

/** Suggested direction from `evaluateExit` — never a guarantee. */
export type ExitRecommendation =
  | typeof ACQUISITION
  | typeof IPO
  | "EITHER"
  | "NEED_MORE_DATA";

export const EXIT_TYPE_LABELS: Record<ExitType, string> = {
  [ACQUISITION]: "Acquisition",
  [IPO]: "IPO / public listing",
};
