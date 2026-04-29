"use client";

import type { AppointmentEventType, AppointmentEventView } from "@/types/scheduling-client";

function label(t: AppointmentEventType): string {
  return t.replace(/_/g, " ");
}

export function AppointmentTimeline({
  events,
}: {
  events: Pick<AppointmentEventView, "id" | "type" | "message" | "createdAt">[];
}) {
  if (events.length === 0) return <p className="text-sm text-slate-500">No events yet.</p>;

  return (
    <ul className="space-y-3">
      {events.map((e) => {
        const d = e.createdAt instanceof Date ? e.createdAt : new Date(e.createdAt);
        return (
          <li key={e.id} className="border-l-2 border-emerald-500/40 pl-3 text-sm">
            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
              <span className="font-semibold uppercase tracking-wide text-emerald-400/90">{label(e.type)}</span>
              <span>{d.toLocaleString()}</span>
            </div>
            {e.message ? <p className="mt-1 text-slate-300">{e.message}</p> : null}
          </li>
        );
      })}
    </ul>
  );
}
