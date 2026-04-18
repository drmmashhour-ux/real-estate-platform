import type { ComplianceCaseSeverity, ComplianceCaseType } from "@prisma/client";

export type ComplianceRuleHit = {
  ruleKey: string;
  caseType: ComplianceCaseType;
  severity: ComplianceCaseSeverity;
  title: string;
  summary: string;
  reasons: string[];
  affectedEntities: { type: string; id?: string }[];
  suggestedActions: string[];
  sourceRefs?: unknown[];
  findingType: string;
};
