import { memo } from "react";
import type { CaseTimelineEvent } from "@/src/modules/case-command-center/domain/case.types";

const kindLabel: Record<CaseTimelineEvent["kind"], string> = {
  audit: "Activity",
  workflow: "Automation",
  ai: "AI",
  signature: "Signature",
};

export const CaseTimeline = memo(function CaseTimeline({ events }: { events: CaseTimelineEvent[] }) {
  const list = events.slice(0, 25);
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <p className="text-sm font-semibold text-white">Timeline</p>
      <p className="text-[10px] text-slate-500">Latest events — validation, edits, approvals, AI, signatures.</p>
      <ul className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1">
        {list.map((t) => (
          <li key={t.id} className="rounded-lg border border-white/5 bg-black/30 px-2 py-1.5 text-xs">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-medium text-slate-200">{t.title}</span>
              <span className="text-[10px] text-slate-500">{new Date(t.createdAt).toLocaleString()}</span>
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
              <span className="rounded bg-white/5 px-1.5 py-0.5">{kindLabel[t.kind]}</span>
              {t.detail ? <span>{t.detail}</span> : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
});
