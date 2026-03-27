"use client";

export type ActionQueueRow = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueAt: string | null;
  sourceType: string | null;
  sourceId: string | null;
  actionUrl: string | null;
  createdAt: string;
};

function sourceBadge(st: string | null): string {
  if (!st) return "Task";
  if (st === "offer") return "Offer";
  if (st === "conversation") return "Message";
  if (st === "appointment") return "Appointment";
  if (st === "required_document") return "Intake";
  if (st === "contract") return "Contract";
  if (st === "broker_client") return "CRM";
  return st;
}

export function ActionQueueItemCard({
  item,
  onComplete,
  onDismiss,
  busy,
}: {
  item: ActionQueueRow;
  onComplete: (id: string) => void;
  onDismiss: (id: string) => void;
  busy: string | null;
}) {
  const overdue = item.dueAt && new Date(item.dueAt) < new Date() && item.status !== "DONE";

  return (
    <li
      className={`rounded-xl border bg-black/20 p-4 ${
        overdue ? "border-amber-500/40" : "border-white/10"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <span className="text-[10px] font-medium uppercase text-slate-500">
            {sourceBadge(item.sourceType)}
          </span>
          {item.priority !== "NORMAL" ? (
            <span className="ml-2 text-[10px] uppercase text-amber-400">{item.priority}</span>
          ) : null}
          <p className="font-medium text-white">{item.title}</p>
          {item.description ? <p className="text-sm text-slate-400">{item.description}</p> : null}
          {item.dueAt ? (
            <p className="mt-1 text-xs text-slate-500">
              Due {new Date(item.dueAt).toLocaleString()}
              {overdue ? " · overdue" : ""}
            </p>
          ) : null}
          <p className="text-[10px] text-slate-600">{item.type.replace(/_/g, " ")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {item.actionUrl ? (
            <a href={item.actionUrl} className="text-xs text-emerald-400 hover:underline">
              Open
            </a>
          ) : null}
          {item.status === "OPEN" || item.status === "IN_PROGRESS" ? (
            <>
              <button
                type="button"
                disabled={busy === item.id}
                onClick={() => onComplete(item.id)}
                className="rounded border border-emerald-500/40 px-2 py-1 text-xs text-emerald-200 hover:bg-emerald-950/40"
              >
                Complete
              </button>
              <button
                type="button"
                disabled={busy === item.id}
                onClick={() => onDismiss(item.id)}
                className="rounded border border-white/15 px-2 py-1 text-xs text-slate-400 hover:bg-white/5"
              >
                Dismiss
              </button>
            </>
          ) : null}
        </div>
      </div>
    </li>
  );
}
