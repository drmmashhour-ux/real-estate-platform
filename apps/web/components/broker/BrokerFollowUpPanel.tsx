"use client";

import type { LeadFollowUpSuggestion } from "@/modules/broker/closing/broker-closing.types";

export type FollowUpPanelItem = LeadFollowUpSuggestion & {
  leadId: string;
  leadName: string;
};

function urgencyClass(u: string): string {
  if (u === "high") return "bg-rose-500/20 text-rose-200 border-rose-500/40";
  if (u === "medium") return "bg-amber-500/20 text-amber-100 border-amber-500/35";
  return "bg-slate-500/15 text-slate-300 border-white/10";
}

export function BrokerFollowUpPanel({
  items,
  accent = "#10b981",
}: {
  items: FollowUpPanelItem[];
  accent?: string;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
        No follow-up suggestions right now — your pipeline looks quiet or leads are in a terminal stage.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-white">Top follow-ups</h3>
        <span className="text-[10px] uppercase tracking-wide text-slate-500">Advisory</span>
      </div>
      <ul className="space-y-3">
        {items.slice(0, 3).map((s) => (
          <li
            key={`${s.leadId}-${s.id}`}
            className="rounded-lg border border-white/10 bg-black/20 p-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${urgencyClass(s.urgency)}`}
              >
                {s.urgency}
              </span>
              <span className="text-xs text-slate-500" style={{ color: `${accent}cc` }}>
                {s.leadName}
              </span>
            </div>
            <p className="mt-1 text-sm font-medium text-white">{s.title}</p>
            <p className="mt-1 text-xs text-slate-400">{s.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
