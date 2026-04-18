export type LeadConversationStage =
  | "instant"
  | "qualification"
  | "engagement"
  | "connection"
  | "conversion";

export type LeadConversationStep = {
  stage: LeadConversationStage;
  message: string;
  intent: string;
};
