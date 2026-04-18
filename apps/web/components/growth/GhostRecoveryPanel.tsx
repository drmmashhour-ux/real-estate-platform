"use client";

import * as React from "react";

import { buildGhostRecoveryMessages } from "@/modules/growth/anti-ghosting.service";
import type { GhostFollowUpTiming } from "@/modules/growth/anti-ghosting.types";

const TIMING_LABEL: Record<GhostFollowUpTiming, string> = {
  "1_hour": "~1 hour",
  same_day: "Same day",
  next_day: "Next day",
};

function CopyBtn({ text }: { text: string }) {
  const [done, setDone] = React.useState(false);
  return (
    <button
      type="button"
      className="rounded-md border border-zinc-600 bg-zinc-800/80 px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-700"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          window.setTimeout(() => setDone(false), 1500);
        } catch {
          /* ignore */
        }
      }}
    >
      {done ? "Copied" : "Copy"}
    </button>
  );
}

export function GhostRecoveryPanel({ defaultCity = "Montréal" }: { defaultCity?: string }) {
  const [city, setCity] = React.useState(defaultCity);
  const items = React.useMemo(() => buildGhostRecoveryMessages(city), [city]);

  return (
    <section className="rounded-xl border border-amber-900/40 bg-amber-950/15 p-4" data-growth-anti-ghosting-v1>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-amber-300/90">Anti-ghosting</p>
          <h3 className="mt-1 text-lg font-semibold text-zinc-100">Recovery messages</h3>
          <p className="mt-1 max-w-xl text-[11px] text-zinc-500">
            Use when a lead goes quiet — send manually; respectful follow-up, no guarantees.
          </p>
        </div>
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          City
          <input
            className="w-44 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-100"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </label>
      </div>

      <ul className="mt-4 space-y-3">
        {items.map((g) => (
          <li key={g.timing} className="rounded-lg border border-zinc-800/80 bg-black/25 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-amber-100/90">{TIMING_LABEL[g.timing]}</span>
              <CopyBtn text={g.message} />
            </div>
            <pre className="mt-2 whitespace-pre-wrap font-sans text-sm leading-relaxed text-zinc-400">{g.message}</pre>
          </li>
        ))}
      </ul>
    </section>
  );
}
