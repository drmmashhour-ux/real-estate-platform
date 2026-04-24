"use client";

export type TimelineEvent = {
  id: string;
  type: string;
  at: string;
  label: string;
  detail?: string;
};

export function ComplaintTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="border border-gray-800 rounded-xl p-4 bg-black text-white">
      <h3 className="text-sm font-semibold text-[#D4AF37] mb-3">Timeline</h3>
      <ol className="space-y-3 border-l border-gray-800 pl-4">
        {events.map((e) => (
          <li key={e.id} className="relative">
            <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-[#D4AF37]" />
            <div className="text-xs text-gray-500">{e.at}</div>
            <div className="text-sm">{e.label}</div>
            {e.detail ? <div className="text-xs text-gray-400">{e.detail}</div> : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
