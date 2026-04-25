export function buildReportRunNumber() {
  const now = new Date();
  return `RPT-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}-${Date.now()}`;
}

export function buildReportManifest(input: {
  reportKey: string;
  reportType: string;
  scopeType: string;
  scopeId?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  modules?: string[];
}) {
  return {
    reportKey: input.reportKey,
    reportType: input.reportType,
    scopeType: input.scopeType,
    scopeId: input.scopeId ?? null,
    dateFrom: input.dateFrom ?? null,
    dateTo: input.dateTo ?? null,
    modules: input.modules ?? [],
    generatedAt: new Date().toISOString(),
  };
}

export function summarizeReportCounts(input: {
  auditRecords?: number;
  complaints?: number;
  trustDeposits?: number;
  financialRecords?: number;
  declarations?: number;
  contracts?: number;
  riskEvents?: number;
}) {
  return {
    auditRecords: input.auditRecords ?? 0,
    complaints: input.complaints ?? 0,
    trustDeposits: input.trustDeposits ?? 0,
    financialRecords: input.financialRecords ?? 0,
    declarations: input.declarations ?? 0,
    contracts: input.contracts ?? 0,
    riskEvents: input.riskEvents ?? 0,
  };
}
