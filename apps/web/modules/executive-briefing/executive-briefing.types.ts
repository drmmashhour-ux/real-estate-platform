import type { ExecutiveBriefingStatus } from "@prisma/client";

export type BriefingSectionContent = {
  facts: string[];
  inference?: string[];
  recommendations?: string[];
  metrics?: Record<string, string | number | null>;
};

export type WeeklyBriefingPayload = {
  weekRange: { start: string; end: string; label: string };
  executiveSummary: BriefingSectionContent;
  kpiSnapshot: BriefingSectionContent;
  improvements: BriefingSectionContent;
  deteriorations: BriefingSectionContent;
  bottlenecks: BriefingSectionContent;
  complianceRisk: BriefingSectionContent;
  revenueBilling: BriefingSectionContent;
  brokerHighlights: BriefingSectionContent;
  listingMarketing: BriefingSectionContent;
  dealsWatch: BriefingSectionContent;
  risks: BriefingSectionContent;
  opportunities: BriefingSectionContent;
  founderActions: BriefingSectionContent;
  estimates?: BriefingSectionContent;
};

export type ExecutiveBriefingGeneratedSummary = {
  version: 1;
  payload: WeeklyBriefingPayload;
  disclaimer: string;
};

export type BriefingListRow = {
  id: string;
  periodType: string;
  periodStart: string;
  periodEnd: string;
  status: ExecutiveBriefingStatus;
  createdAt: string;
  updatedAt: string;
};
