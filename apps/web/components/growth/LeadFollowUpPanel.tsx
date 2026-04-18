"use client";

import * as React from "react";

import { getLeadFollowUpMessages } from "@/modules/growth/lead-followup-messages.service";
import type { LeadFollowUpStage } from "@/modules/growth/lead-followup-messages.types";

const STAGE_LABEL: Record<LeadFollowUpStage, string> = {
  instant: "INSTANT",
  "5min": "5 MIN",
  "1hour": "1 HOUR",
  same_day: "SAME DAY",
  next_day: "NEXT DAY",
};

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = React.useState(false);
  return (
    <button
      type="button"
      className="rounded-md border border-zinc-600 bg-zinc-800/80 px-2 py-1 text-xs font-medium text-zinc-200 hover:bg-zinc-700"
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
      {done ? "Copied" : label}
    </button>
  );
}

export function LeadFollowUpPanel({ defaultCity = "Montréal" }: { defaultCity?: string }) {
  const [city, setCity] = React.useState(defaultCity);
  const messages = React.useMemo(() => getLeadFollowUpMessages(city), [city]);

  return (
    <section
      className="rounded-xl border border-sky-900/50 bg-sky-950/20 p-4"
      data-growth-lead-followup-v1
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-sky-300/90">Lead follow-up (V1)</p>
          <h3 className="mt-1 text-lg font-semibold text-zinc-100">Conversation cadence</h3>
          <p className="mt-1 max-w-xl text-[11px] text-zinc-500">
            Copy and send yourself — no automation. Aligns with lead → conversation → showing → deal.
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

      <ul className="mt-4 space-y-4">
        {messages.map((m) => (
          <li key={m.stage} className="rounded-lg border border-zinc-800/90 bg-black/30 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-400/90">{STAGE_LABEL[m.stage]}</p>
            <pre className="mt-2 whitespace-pre-wrap font-sans text-sm leading-relaxed text-zinc-300">{m.message}</pre>
            <div className="mt-2">
              <CopyButton text={m.message} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
