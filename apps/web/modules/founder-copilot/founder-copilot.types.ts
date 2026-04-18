export type CopilotAnswerType =
  | "summary"
  | "bottleneck"
  | "deals"
  | "workload"
  | "response_time"
  | "marketing"
  | "conversion"
  | "revenue"
  | "review_today"
  | "delegation"
  | "generic";

export type FounderCopilotAnswer = {
  answerType: CopilotAnswerType;
  title: string;
  summary: string;
  evidence: { ref: string; value?: string | number | null; nature: "fact" | "inference" | "estimate" }[];
  recommendedActions: { label: string; nature: "recommendation" | "review" }[];
  confidence: number;
  followupAreas: string[];
};

export type FounderCopilotRunResult = {
  title: string;
  summary: string;
  topPriorities: { title: string; evidence: string[] }[];
  risks: string[];
  opportunities: string[];
  answer: FounderCopilotAnswer | null;
};
