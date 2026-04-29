"use client";

import type {
  BrokerClientInteractionTimelineRow,
  BrokerInteractionType,
} from "@/types/broker-crm-client";

function typeLabel(t: BrokerInteractionType): string {
  return t.replace(/_/g, " ");
}

export function ClientInteractionTimeline({
  interactions,
}: {
  interactions: BrokerClientInteractionTimelineRow[];
}) {
  if (interactions.length === 0) {
    return <p className="text-sm text-slate-500">No interactions yet.</p>;
  }

  return (
    <ul className="space-y-4">
      {interactions.map((row) => (
        <li
          key={row.id}
          className="relative border-l border-white/10 pl-5 text-sm text-slate-200 before:absolute before:left-[-5px] before:top-1.5 before:h-2 before:w-2 before:rounded-full before:bg-emerald-500/80"
        >
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-medium uppercase tracking-wide text-emerald-400/90">
              {typeLabel(row.type)}
            </span>
            <span>·</span>
            <time
              dateTime={
                (row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt)).toISOString()
              }
            >
              {(row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt)).toLocaleString(
                undefined,
                {
                  dateStyle: "medium",
                  timeStyle: "short",
                }
              )}
            </time>
            {row.dueAt ? (
              <>
                <span>·</span>
                <span>
                  Due{" "}
                  {(row.dueAt instanceof Date ? row.dueAt : new Date(row.dueAt)).toLocaleDateString()}
                </span>
              </>
            ) : null}
            {row.completedAt ? (
              <span className="rounded bg-white/5 px-1.5 py-0.5 text-emerald-300/90">Done</span>
            ) : null}
          </div>
          {row.title ? <p className="mt-1 font-medium text-white">{row.title}</p> : null}
          {row.message ? <p className="mt-1 whitespace-pre-wrap text-slate-300">{row.message}</p> : null}
        </li>
      ))}
    </ul>
  );
}
