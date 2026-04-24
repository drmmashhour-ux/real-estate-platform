"use client";

import { getEscalationDestinationMeta } from "@/lib/compliance/complaints/oaciq-escalation-destinations";
import type { ComplaintReferralDestination } from "@/modules/complaints/schemas/escalation-referral.schema";

export type OaciqEscalationPanelProps = {
  destination: ComplaintReferralDestination;
  reason: string;
  internalReviewCompleted: boolean;
  outcomeNote?: string | null;
};

export function OaciqEscalationPanel(props: OaciqEscalationPanelProps) {
  const meta = getEscalationDestinationMeta(props.destination);

  return (
    <div className="rounded-xl border border-amber-900/40 bg-zinc-950 p-4 text-white space-y-2">
      <h3 className="text-sm font-semibold text-amber-200">OACIQ / external escalation (manual only)</h3>
      <p className="text-xs text-gray-500">
        The platform does not auto-submit complaints to regulators. This panel records human decisions only.
      </p>
      <div className="text-sm">
        <div className="text-[#D4AF37]">{meta?.labelEn ?? props.destination}</div>
        <p className="text-gray-400 text-xs mt-1">{props.reason}</p>
      </div>
      <div className="text-xs text-gray-500">
        Internal review first: {props.internalReviewCompleted ? "completed" : "pending"}
      </div>
      {props.outcomeNote ? <p className="text-xs text-gray-400">Outcome note: {props.outcomeNote}</p> : null}
    </div>
  );
}
