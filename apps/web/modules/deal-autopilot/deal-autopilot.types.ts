export type DealHealthLevel = "healthy" | "attention" | "at_risk" | "blocked";

export type UrgencyLevel = "low" | "medium" | "high" | "critical";

export type AutopilotBlocker = {
  id: string;
  category: "document" | "compliance" | "condition" | "request" | "payment" | "signature" | "coordination" | "negotiation" | "other";
  title: string;
  detail: string;
  severity: UrgencyLevel;
};

export type OverdueItem = {
  id: string;
  kind: "condition" | "request" | "generic";
  label: string;
  dueAt: string | null;
  daysOverdue: number | null;
};

export type NextBestAction = {
  id: string;
  title: string;
  summary: string;
  whyItMatters: string;
  urgency: UrgencyLevel;
  riskIfIgnored: string;
  suggestedAction: string;
  brokerApprovalRequired: boolean;
  rank: number;
};

export type ClosingReadiness = {
  score: number;
  label: string;
  checklist: { key: string; ok: boolean; note?: string }[];
};

export type DealAutopilotSnapshot = {
  dealId: string;
  generatedAt: string;
  dealHealth: DealHealthLevel;
  currentStage: string;
  confidence: number;
  blockers: AutopilotBlocker[];
  overdueItems: OverdueItem[];
  nextBestActions: NextBestAction[];
  closingReadiness: ClosingReadiness;
  disclaimer: string;
};

export type BrokerActionQueueItem = NextBestAction & { bundleId?: string };
