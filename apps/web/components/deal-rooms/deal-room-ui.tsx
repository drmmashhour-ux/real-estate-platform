"use client";

import type { DealPriorityLabel, DealRoomStage } from "@/types/deal-room-enums";

const STAGE_ORDER: DealRoomStage[] = [
  "new_interest",
  "qualified",
  "visit_scheduled",
  "visit_completed",
  "offer_preparing",
  "offer_submitted",
  "negotiating",
  "accepted",
  "documents_pending",
  "payment_pending",
  "closed",
  "lost",
];

const STAGE_LABEL: Record<DealRoomStage, string> = {
  new_interest: "New interest",
  qualified: "Qualified",
  visit_scheduled: "Visit scheduled",
  visit_completed: "Visit completed",
  offer_preparing: "Offer preparing",
  offer_submitted: "Offer submitted",
  negotiating: "Negotiating",
  accepted: "Accepted",
  documents_pending: "Documents pending",
  payment_pending: "Payment pending",
  closed: "Closed",
  lost: "Lost",
};

const PRIORITY_CLASS: Record<DealPriorityLabel, string> = {
  low: "border-slate-600 text-slate-400",
  medium: "border-amber-500/40 text-amber-200",
  high: "border-red-500/40 text-red-200",
};

export function stageLabel(s: DealRoomStage) {
  return STAGE_LABEL[s] ?? s;
}

export function StageBadge({ stage }: { stage: DealRoomStage }) {
  return (
    <span className="inline-flex rounded-md border border-slate-600 bg-slate-900/80 px-2 py-0.5 text-[11px] font-medium text-slate-200">
      {stageLabel(stage)}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: DealPriorityLabel }) {
  return (
    <span className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] ${PRIORITY_CLASS[priority]}`}>
      {priority}
    </span>
  );
}

export { STAGE_ORDER };
