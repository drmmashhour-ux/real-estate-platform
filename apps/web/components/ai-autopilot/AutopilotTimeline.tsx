"use client";

type EventRow = {
  id: string;
  eventKey: string;
  createdAt: string;
};

export function AutopilotTimeline({ events }: { events: EventRow[] }) {
  if (events.length === 0) return null;
  return (
    <div className="mt-4 border-t border-white/10 pt-3">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#D4AF37]/80">Audit récent</p>
      <ul className="mt-2 max-h-40 space-y-2 overflow-y-auto text-xs text-zinc-400">
        {events.slice(0, 12).map((e) => (
          <li key={e.id} className="flex justify-between gap-2 border-b border-white/5 pb-1">
            <span className="text-zinc-300">{e.eventKey.replace(/_/g, " ")}</span>
            <time className="shrink-0 text-[10px] text-zinc-500">{new Date(e.createdAt).toLocaleString()}</time>
          </li>
        ))}
      </ul>
    </div>
  );
}
