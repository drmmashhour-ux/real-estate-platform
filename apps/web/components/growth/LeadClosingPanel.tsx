"use client";

import * as React from "react";

import { getLeadClosingScripts } from "@/modules/growth/lead-closing.service";
import type { LeadClosingStage } from "@/modules/growth/lead-closing.types";

const STAGE_LABEL: Record<LeadClosingStage, string> = {
  qualification: "Qualification",
  engagement: "Engagement",
  connection: "Connection",
  conversion: "Conversion",
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

export function LeadClosingPanel({ defaultCity = "Montréal" }: { defaultCity?: string }) {
  const [city, setCity] = React.useState(defaultCity);
  const scripts = React.useMemo(() => getLeadClosingScripts(city), [city]);

  return (
    <section
      className="rounded-xl border border-teal-900/45 bg-teal-950/15 p-4"
      data-growth-lead-closing-v1
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-teal-300/90">Lead closing (V1)</p>
          <h3 className="mt-1 text-lg font-semibold text-zinc-100">Stage scripts</h3>
          <p className="mt-1 max-w-xl text-[11px] text-zinc-500">
            Copy-paste only — you send every message. Nothing is automated; no outcome guarantees.
          </p>
        </div>
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          City for templates
          <input
            className="w-44 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-100"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </label>
      </div>

      <ul className="mt-4 space-y-3">
        {scripts.map((s) => (
          <li key={s.stage} className="rounded-lg border border-zinc-800/80 bg-black/25 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-teal-100/90">{STAGE_LABEL[s.stage]}</span>
              <CopyBtn text={s.message} />
            </div>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">{s.message}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
