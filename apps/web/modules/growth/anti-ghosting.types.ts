export type GhostFollowUpTiming = "1_hour" | "same_day" | "next_day";

export type GhostFollowUp = {
  timing: GhostFollowUpTiming;
  message: string;
};
