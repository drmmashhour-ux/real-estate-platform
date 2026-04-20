"use client";

import { LegalRuleSummary, type RuleRow } from "./LegalRuleSummary";
import { LegalValidationSummary, type ValidationSummaryLite } from "./LegalValidationSummary";

export type LegalRecordAdminRow = {
  id: string;
  entityType: string;
  entityId: string;
  recordType: string;
  status: string;
  createdAt: string;
  validationSummary: ValidationSummaryLite | null;
  ruleSummary: RuleRow[];
};

export function LegalRecordDetailsCard({ record }: { record: LegalRecordAdminRow }) {
  return (
    <div className="rounded-lg border border-slate-800/80 bg-slate-950/50 p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <span className="font-mono text-[10px] text-slate-500">{record.id}</span>
          <h3 className="text-sm font-medium text-slate-200">{record.recordType}</h3>
        </div>
        <span className="rounded px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-400 ring-1 ring-slate-700">
          {record.status}
        </span>
      </div>
      <p className="mt-2 text-[11px] text-slate-500">
        Entity {record.entityType}:{record.entityId} · {record.createdAt}
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <h4 className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Validation</h4>
          <LegalValidationSummary validation={record.validationSummary} />
        </div>
        <div>
          <h4 className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Rules</h4>
          <LegalRuleSummary rules={record.ruleSummary} />
        </div>
      </div>
    </div>
  );
}
