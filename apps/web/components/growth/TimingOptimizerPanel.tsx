"use client";

import * as React from "react";

import { getBestActionTiming } from "@/modules/growth/timing-optimizer.service";
import type { TimingUrgency } from "@/modules/growth/timing-optimizer.service";

const URGENCY_STYLE: Record<TimingUrgency, string> = {
  critical: "border-red-500/40 bg-red-950/30 text-red-200/90",
  high: "border-amber-500/40 bg-amber-950/25 text-amber-200/90",
  standard: "border-zinc-600 bg-zinc-900/50 text-zinc-300",
};

const URGENCY_LABEL: Record<TimingUrgency, string> = {
  critical: "Critical",
  high: "High",
  standard: "Standard",
};

export function TimingOptimizerPanel() {
  const windows = React.useMemo(() => getBestActionTiming(), []);

  return (
    <section
      className="rounded-xl border border-cyan-900/45 bg-cyan-950/15 p-4"
      data-growth-timing-optimizer-v1
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan-300/90">Timing optimizer</p>
        <h3 className="mt-1 text-lg font-semibold text-zinc-100">Recommended windows (V1)</h3>
        <p className="mt-1 max-w-xl text-[11px] text-zinc-500">
          Advisory SLAs for operators — adapt to context; nothing auto-sends.
        </p>
      </div>

      <ul className="mt-4 space-y-2">
        {windows.map((w) => (
          <li
            key={w.recommendation}
            className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm ${URGENCY_STYLE[w.urgency]}`}
          >
            <span>{w.recommendation}</span>
            <span className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide">
              {URGENCY_LABEL[w.urgency]}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
