"use client";

export function ApprovalActionsPanel({
  actionQueueId,
  busy,
  onApprove,
  onReject,
  onExecute,
}: {
  actionQueueId: string | null;
  busy: boolean;
  onApprove: (executeAfter: boolean) => void;
  onReject: () => void;
  onExecute: () => void;
}) {
  if (!actionQueueId) {
    return <p className="text-xs text-slate-500">Select a queue row to approve or reject.</p>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={busy}
        className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-40"
        onClick={() => onApprove(false)}
      >
        Approve only
      </button>
      <button
        type="button"
        disabled={busy}
        className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-40"
        onClick={() => onApprove(true)}
      >
        Approve + execute (safe adapters)
      </button>
      <button
        type="button"
        disabled={busy}
        className="rounded-lg bg-slate-700 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-600 disabled:opacity-40"
        onClick={() => onExecute()}
      >
        Execute approved
      </button>
      <button
        type="button"
        disabled={busy}
        className="rounded-lg bg-rose-900/80 px-3 py-2 text-xs font-semibold text-rose-100 hover:bg-rose-800 disabled:opacity-40"
        onClick={() => onReject()}
      >
        Reject
      </button>
    </div>
  );
}
