type Event = { id: string; actionType: string; createdAt: string | Date };

export function DocumentTimeline({ events }: { events: Event[] }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <p className="text-sm font-semibold text-white">Timeline</p>
      <ul className="mt-2 space-y-1 text-xs text-slate-300">
        {events.length ? events.map((e) => (
          <li key={e.id} className="rounded-md bg-white/5 px-2 py-1">
            <span>{e.actionType.replace(/_/g, " ")}</span>
            <span className="ml-2 text-slate-500">{new Date(e.createdAt).toLocaleString()}</span>
          </li>
        )) : <li className="text-slate-500">No timeline steps yet.</li>}
      </ul>
    </div>
  );
}
