export type AuditItem = {
  id: string;
  label: string;
  status: "pass" | "fail" | "warn";
  details?: string;
};

export type AuditResult = {
  score: number;
  criticalPass: boolean;
  items: AuditItem[];
};
