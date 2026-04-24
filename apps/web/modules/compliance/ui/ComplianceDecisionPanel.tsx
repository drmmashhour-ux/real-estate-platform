"use client";

import type { ComplianceDecision } from "@/modules/compliance/core/decision";

export function ComplianceDecisionPanel(props: { decision: ComplianceDecision }) {
  return (
    <div className="rounded-xl border border-[#D4AF37]/30 bg-zinc-950 p-4 text-white space-y-2">
      <h3 className="text-sm font-semibold text-[#D4AF37]">Engine decision</h3>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="text-gray-500">Status</div>
        <div className="font-mono">{props.decision.status}</div>
        <div className="text-gray-500">Manual review</div>
        <div>{props.decision.requiresManualReview ? "Yes" : "No"}</div>
        <div className="text-gray-500">Worst severity</div>
        <div>{props.decision.worstSeverity}</div>
      </div>
    </div>
  );
}
