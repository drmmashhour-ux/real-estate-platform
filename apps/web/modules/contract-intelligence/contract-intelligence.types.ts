export type IssueSeverity = "info" | "warning" | "critical";

export type ContractIntelligenceIssue = {
  severity: IssueSeverity;
  issueType: string;
  title: string;
  summary: string;
  affectedDocumentType?: string;
  affectedFieldKeys?: string[];
  suggestedFix?: string;
  explanation: string[];
  brokerReviewRequired: true;
};

export type ContractIntelligenceRunResult = {
  issues: ContractIntelligenceIssue[];
  generatedAt: string;
  disclaimer: string;
};
