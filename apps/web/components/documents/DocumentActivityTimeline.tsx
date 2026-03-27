"use client";

export type ActivityRow = {
  id: string;
  type: string;
  message: string | null;
  createdAt: string;
  actor: { name: string | null; email: string } | null;
};

export function DocumentActivityTimeline({ events }: { events: ActivityRow[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-slate-500">No activity yet.</p>;
  }
  return (
    <ul className="space-y-3 text-sm">
      {events.map((e) => (
        <li key={e.id} className="border-l-2 border-slate-700 pl-3">
          <div className="font-medium text-slate-200">{e.type.replace(/_/g, " ")}</div>
          {e.message ? <p className="text-slate-400">{e.message}</p> : null}
          <p className="text-xs text-slate-500">
            {e.actor?.name || e.actor?.email || "System"} · {new Date(e.createdAt).toLocaleString()}
          </p>
        </li>
      ))}
    </ul>
  );
}
