export type LeadClosingStage = "qualification" | "engagement" | "connection" | "conversion";

export type LeadClosingScript = {
  stage: LeadClosingStage;
  message: string;
};
