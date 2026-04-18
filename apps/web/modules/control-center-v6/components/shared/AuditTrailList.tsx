"use client";

import type { CommandCenterAuditTrailEntry } from "../../company-command-center-v6.types";
import { TraceabilityBadge } from "./TraceabilityBadge";

export function AuditTrailList({ entries }: { entries: CommandCenterAuditTrailEntry[] }) {
  if (!entries.length) {
    return <p className="text-xs text-zinc-500">No audit rows in this window.</p>;
  }
  return (
    <ul className="space-y-2">
      {entries.map((e) => (
        <li key={e.id} className="rounded-lg border border-zinc-800/80 bg-zinc-900/20 px-3 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <TraceabilityBadge severity={e.severity} />
            <span className="text-[10px] uppercase text-zinc-500">{e.source}</span>
            <span className="text-[10px] text-zinc-600">{e.system}</span>
          </div>
          <p className="mt-1 text-xs font-medium text-zinc-200">{e.title}</p>
          <p className="mt-0.5 text-[11px] text-zinc-400">{e.detail}</p>
          {e.provenance ? <p className="mt-1 text-[10px] text-zinc-600">Provenance: {e.provenance}</p> : null}
        </li>
      ))}
    </ul>
  );
}
