"use client";

import type { FinancialComplianceRecord } from "@/modules/compliance/services/compliance-financial-record.service";

export function FinancialRecordPanel(props: { record?: FinancialComplianceRecord | null }) {
  if (!props.record) {
    return (
      <div className="rounded-xl border border-amber-900/40 bg-black p-4 text-amber-200 text-sm">
        No financial compliance record linked for this case.
      </div>
    );
  }
  const r = props.record;
  return (
    <div className="rounded-xl border border-gray-800 bg-black p-4 text-white text-sm space-y-1">
      <h3 className="text-[#D4AF37] font-semibold mb-2">Financial record</h3>
      <div className="font-mono text-xs text-gray-500">{r.recordId}</div>
      <div>Category: {r.category}</div>
      <div>
        Amount: {r.amount} {r.currency}
      </div>
      {r.gst != null ? <div>GST: {r.gst}</div> : null}
      {r.qst != null ? <div>QST: {r.qst}</div> : null}
      {r.total != null ? <div>Total: {r.total}</div> : null}
      <div>Trust-related: {r.trustAccountRelated ? "yes" : "no"}</div>
      <div className="text-xs text-gray-500">Docs: {r.supportingDocumentIds.join(", ") || "—"}</div>
    </div>
  );
}
