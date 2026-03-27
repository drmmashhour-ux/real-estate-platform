"use client";

import type { TransparencyEvent } from "@/src/modules/client-trust-experience/domain/clientExperience.types";

function kindLabel(kind: TransparencyEvent["kind"]) {
  switch (kind) {
    case "ai":
      return "AI";
    case "approval":
      return "Approval";
    case "edit":
      return "Edit";
    default:
      return "Event";
  }
}

export function TransparencyPanel({ events }: { events: TransparencyEvent[] }) {
  if (!events.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/20 p-3">
        <p className="text-sm font-semibold text-white">Transparency</p>
        <p className="mt-1 text-xs text-slate-400">No activity history yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <p className="text-sm font-semibold text-white">Transparency</p>
      <p className="mt-1 text-xs text-slate-400">Recent steps on this document (edits, AI touches, approvals).</p>
      <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto text-xs">
        {events.map((e) => (
          <li key={e.id} className="rounded-lg border border-white/5 bg-black/30 p-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase text-slate-300">{kindLabel(e.kind)}</span>
              <span className="font-medium text-slate-200">{e.label}</span>
            </div>
            {e.at ? <p className="mt-1 text-[10px] text-slate-500">{e.at}</p> : null}
            {e.detail ? <p className="mt-1 text-[11px] text-slate-500">{e.detail}</p> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
