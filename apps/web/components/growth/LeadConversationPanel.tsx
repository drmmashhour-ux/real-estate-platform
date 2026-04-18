"use client";

import * as React from "react";

import { buildLeadConversationFlow } from "@/modules/growth/lead-conversation.service";
import type { LeadConversationStage } from "@/modules/growth/lead-conversation.types";

const STAGE_LABEL: Record<LeadConversationStage, string> = {
  instant: "Instant",
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

export function LeadConversationPanel({ defaultCity = "Montréal" }: { defaultCity?: string }) {
  const [city, setCity] = React.useState(defaultCity);
  const [active, setActive] = React.useState(0);
  const steps = React.useMemo(() => buildLeadConversationFlow(city), [city]);

  return (
    <section
      className="rounded-xl border border-fuchsia-900/40 bg-fuchsia-950/15 p-4"
      data-growth-lead-conversation-v1
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-fuchsia-300/90">Lead conversation</p>
          <h3 className="mt-1 text-lg font-semibold text-zinc-100">Flow (V1)</h3>
          <p className="mt-1 max-w-xl text-[11px] text-zinc-500">
            Copy-paste only — you send every message. Does not change CRM data.
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

      <div className="mt-3 flex flex-wrap gap-1.5">
        {steps.map((s, i) => (
          <button
            key={s.stage}
            type="button"
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              active === i ? "bg-fuchsia-600 text-white" : "border border-zinc-700 bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
            }`}
            onClick={() => setActive(i)}
          >
            {i + 1}. {STAGE_LABEL[s.stage]}
          </button>
        ))}
      </div>

      <ul className="mt-4 space-y-3">
        {steps.map((s, i) => (
          <li
            key={s.stage}
            className={`rounded-lg border p-3 ${
              active === i ? "border-fuchsia-500/50 bg-fuchsia-950/25" : "border-zinc-800/80 bg-black/25"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <span className="text-sm font-semibold text-fuchsia-100/90">
                  {i + 1}. {STAGE_LABEL[s.stage]}
                </span>
                <p className="mt-1 text-xs text-zinc-500">Intent: {s.intent}</p>
              </div>
              <CopyBtn text={s.message} />
            </div>
            <pre className="mt-2 whitespace-pre-wrap font-sans text-sm leading-relaxed text-zinc-400">{s.message}</pre>
          </li>
        ))}
      </ul>
    </section>
  );
}
