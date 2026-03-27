import type { ClientIntakeEventType } from "@prisma/client";

export type TimelineRow = {
  id: string;
  type: ClientIntakeEventType;
  message: string | null;
  createdAt: string;
  actor: { id: string; name: string | null; email: string | null } | null;
};

function labelForType(t: ClientIntakeEventType): string {
  switch (t) {
    case "INTAKE_CREATED":
      return "Intake created";
    case "INTAKE_UPDATED":
      return "Profile updated";
    case "STATUS_CHANGED":
      return "Intake status";
    case "DOCUMENT_REQUESTED":
      return "Document requested";
    case "DOCUMENT_UPLOADED":
      return "Document uploaded";
    case "DOCUMENT_LINKED":
      return "File linked";
    case "DOCUMENT_APPROVED":
      return "Approved";
    case "DOCUMENT_REJECTED":
      return "Rejected";
    case "DOCUMENT_WAIVED":
      return "Waived";
    case "NOTE_ADDED":
      return "Note";
    default:
      return t;
  }
}

export function ClientIntakeTimeline({ events }: { events: TimelineRow[] }) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-slate-500">No activity yet.</p>
    );
  }

  return (
    <ul className="space-y-3 text-sm">
      {events.map((e) => (
        <li key={e.id} className="flex gap-3 border-l border-white/10 pl-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-slate-200">{labelForType(e.type)}</span>
              <span className="text-xs text-slate-500">
                {new Date(e.createdAt).toLocaleString()}
              </span>
            </div>
            {e.actor ? (
              <p className="text-xs text-slate-500">
                {e.actor.name ?? e.actor.email ?? e.actor.id.slice(0, 8)}
              </p>
            ) : null}
            {e.message ? <p className="mt-1 text-slate-400">{e.message}</p> : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
