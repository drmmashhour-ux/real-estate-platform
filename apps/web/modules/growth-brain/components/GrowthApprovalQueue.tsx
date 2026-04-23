"use client";

import type { ApprovalQueueItem } from "../growth-brain.types";

type Props = {
  items: ApprovalQueueItem[];
  onDecide?: (id: string, status: "approved" | "rejected") => void;
};

export function GrowthApprovalQueue({ items, onDecide }: Props) {
  const pending = items.filter((q) => q.status === "pending");

  if (!pending.length) {
    return <p className="text-sm text-zinc-600">No pending approvals.</p>;
  }

  return (
    <ul className="space-y-3">
      {pending.map((q) => (
        <li key={q.id} className="rounded-xl border border-amber-600/30 bg-black/40 px-4 py-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-medium text-white">{q.title}</p>
              <p className="mt-1 text-xs text-zinc-400">{q.summary}</p>
              <p className="mt-1 text-[10px] uppercase text-zinc-600">{q.riskLevel} risk</p>
            </div>
            {onDecide ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded-lg bg-emerald-700/80 px-3 py-1 text-xs text-white hover:bg-emerald-600"
                  onClick={() => onDecide(q.id, "approved")}
                >
                  Approve
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-white/15 px-3 py-1 text-xs text-zinc-300 hover:bg-white/10"
                  onClick={() => onDecide(q.id, "rejected")}
                >
                  Reject
                </button>
              </div>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
