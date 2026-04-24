"use client";

export type ComplaintCaseCardProps = {
  caseNumber: string;
  severity: string;
  status: string;
  assignedOwnerLabel?: string | null;
  daysOpen: number;
  linkedListingId?: string | null;
  linkedDealId?: string | null;
  linkedBrokerId?: string | null;
  suggestSyndic?: boolean;
  suggestPublicAssistance?: boolean;
};

export function ComplaintCaseCard(props: ComplaintCaseCardProps) {
  return (
    <div className="rounded-xl border border-[#D4AF37]/30 bg-black p-4 text-white space-y-2">
      <div className="flex flex-wrap justify-between gap-2">
        <span className="font-mono text-[#D4AF37]">{props.caseNumber}</span>
        <span className="text-xs uppercase text-gray-400">{props.status}</span>
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded-full border border-gray-600 px-2 py-0.5">severity: {props.severity}</span>
        <span className="rounded-full border border-gray-600 px-2 py-0.5">age: {props.daysOpen}d</span>
        {props.assignedOwnerLabel ? (
          <span className="rounded-full border border-gray-600 px-2 py-0.5">owner: {props.assignedOwnerLabel}</span>
        ) : (
          <span className="rounded-full border border-amber-700/50 px-2 py-0.5 text-amber-400">unassigned</span>
        )}
      </div>
      <div className="text-xs text-gray-500 space-y-1">
        {props.linkedListingId ? <div>Listing: {props.linkedListingId}</div> : null}
        {props.linkedDealId ? <div>Deal: {props.linkedDealId}</div> : null}
        {props.linkedBrokerId ? <div>Broker: {props.linkedBrokerId}</div> : null}
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        {props.suggestSyndic ? (
          <span className="text-amber-400 border border-amber-700/40 rounded px-2 py-0.5">Syndic suggested</span>
        ) : null}
        {props.suggestPublicAssistance ? (
          <span className="text-sky-300 border border-sky-800/40 rounded px-2 py-0.5">Public assistance</span>
        ) : null}
      </div>
    </div>
  );
}
