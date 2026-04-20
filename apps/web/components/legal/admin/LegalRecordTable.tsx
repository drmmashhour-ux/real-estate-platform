"use client";

import type { LegalRecordAdminRow } from "./LegalRecordDetailsCard";

export function LegalRecordTable({
  records,
  selectedId,
  onSelect,
}: {
  records: LegalRecordAdminRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (!records.length) {
    return <p className="text-xs text-slate-500">No legal records in scope.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-800/80">
      <table className="min-w-full border-collapse text-left text-[11px] text-slate-300">
        <thead className="bg-slate-950/80 text-[10px] uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-3 py-2">Type</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Entity</th>
            <th className="px-3 py-2">Issues</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => {
            const miss = r.validationSummary?.missingFields?.length ?? 0;
            const inc = r.validationSummary?.inconsistentFields?.length ?? 0;
            const selected = r.id === selectedId;
            return (
              <tr
                key={r.id}
                className={`cursor-pointer border-t border-slate-800/60 hover:bg-slate-900/50 ${selected ? "bg-slate-900/70" : ""}`}
                onClick={() => onSelect(r.id)}
              >
                <td className="px-3 py-2 font-medium text-slate-200">{r.recordType}</td>
                <td className="px-3 py-2 text-slate-400">{r.status}</td>
                <td className="max-w-[180px] truncate px-3 py-2 font-mono text-[10px] text-slate-500">
                  {r.entityType}:{r.entityId}
                </td>
                <td className="px-3 py-2 text-slate-500">
                  {miss + inc === 0 ? "—" : `${miss} missing · ${inc} inconsistent`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
