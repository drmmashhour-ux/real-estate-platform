"use client";

import type { OfferEvent, OfferEventType } from "@prisma/client";

const LABELS: Partial<Record<OfferEventType, string>> & Record<string, string> = {
  CREATED: "Created",
  SUBMITTED: "Submitted",
  STATUS_CHANGED: "Status update",
  COUNTERED: "Counter-offer",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
  NOTE_ADDED: "Note",
};

type Props = {
  events: Pick<OfferEvent, "id" | "type" | "message" | "createdAt" | "metadata">[];
};

export function OfferTimeline({ events }: Props) {
  if (events.length === 0) {
    return <p className="text-sm text-slate-500">No activity yet.</p>;
  }

  return (
    <ol className="relative border-l border-white/10 pl-6">
      {events.map((e) => (
        <li key={e.id} className="mb-6 last:mb-0">
          <span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-[#C9A96E]/80" aria-hidden />
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            {LABELS[e.type as OfferEventType] ?? e.type}
          </p>
          <p className="text-xs text-slate-400">
            {new Date(e.createdAt).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
          {e.message ? <p className="mt-1 text-sm text-slate-200">{e.message}</p> : null}
        </li>
      ))}
    </ol>
  );
}
