export const OUTCOME_TYPES = [
  "approved",
  "rejected",
  "ignored",
  "applied",
  "reverted",
  "success",
  "failure",
] as const;

export type OutcomeType = (typeof OUTCOME_TYPES)[number];

export function getScore(outcomeType: OutcomeType): number {
  switch (outcomeType) {
    case "approved":
    case "applied":
    case "success":
      return 2;
    case "rejected":
    case "reverted":
    case "failure":
      return -2;
    case "ignored":
      return -1;
  }
}
