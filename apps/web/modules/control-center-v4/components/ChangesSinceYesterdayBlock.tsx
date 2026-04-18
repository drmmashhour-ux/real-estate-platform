"use client";

import type { CommandCenterSystemDelta } from "../company-command-center-v4.types";

export function ChangesSinceYesterdayBlock({
  systems,
  executiveSummary,
  insufficientBaseline,
}: {
  systems: CommandCenterSystemDelta[];
  executiveSummary: string[];
  insufficientBaseline: boolean;
}) {
  if (insufficientBaseline) {
    return (
      <div className="rounded-lg border border-amber-900/40 bg-amber-950/10 px-3 py-2 text-xs text-amber-100/90">
        {executiveSummary[0] ?? "Insufficient baseline for window comparison."}
      </div>
    );
  }
  const changed = systems.filter((s) => s.changed);
  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-[10px] font-semibold uppercase text-zinc-500">Executive delta</h4>
        <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-zinc-300">
          {executiveSummary.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </div>
      <div>
        <h4 className="text-[10px] font-semibold uppercase text-zinc-500">Systems ({changed.length} changed)</h4>
        <ul className="mt-2 space-y-2">
          {systems.map((s) => (
            <li key={s.system} className="rounded border border-zinc-800/60 px-2 py-1.5 text-[11px] text-zinc-400">
              <span className="font-medium text-zinc-200">{s.system}</span> — {s.summary}
              {s.riskShift ? ` · risk ${s.riskShift}` : ""}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
