export type LeadFollowUpStage =
  | "instant"
  | "5min"
  | "1hour"
  | "same_day"
  | "next_day";

export type LeadFollowUpMessage = {
  stage: LeadFollowUpStage;
  message: string;
};
