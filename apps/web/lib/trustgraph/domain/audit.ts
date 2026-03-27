export type AuditCaseHistoryRow = {
  id: string;
  entityType: string;
  entityId: string;
  status: string;
  trustLevel: string | null;
  readinessLevel: string | null;
  updatedAt: string;
};

export type AuditPackageManifestDto = {
  exportVersion: string;
  generatedAt: string;
  workspaceId: string;
  packageHash: string;
  sections: {
    caseHistory: AuditCaseHistoryRow[];
    ruleResultsSample: unknown[];
    reviewActionsSample: unknown[];
  };
};
