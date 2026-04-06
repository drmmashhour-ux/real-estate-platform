export const ASSIGNMENT_STATUS = ["assigned", "contacted", "closed", "lost"] as const;
export type AssignmentStatus = (typeof ASSIGNMENT_STATUS)[number];

export type DistributionMode = "round_robin" | "priority";

/** Default platform-side commission accrual rate applied to attributed deal $ for leaderboard (tunable). */
export const DEFAULT_COMMISSION_RATE_ON_DEAL = 0.025;
