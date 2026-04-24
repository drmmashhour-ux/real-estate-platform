export type ComplianceReviewForm = {
  reviewId: string;
  caseId: string;
  reviewerBrokerId: string;
  findings: string[];
  manualReviewRequired: boolean;
  blockingIssues: string[];
  createdAt: string;
};
