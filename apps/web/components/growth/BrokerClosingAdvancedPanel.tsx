"use client";

import * as React from "react";

import { getBrokerClosingPressureScripts } from "@/modules/growth/broker-closing-advanced.service";
import type { BrokerPressureScriptType } from "@/modules/growth/broker-closing-advanced.types";

const TYPE_LABEL: Record<BrokerPressureScriptType, string> = {
  activation: "ACTIVATION",
  urgency: "URGENCY",
  performance: "PERFORMANCE",
  followup: "FOLLOW-UP PUSH",
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

export function BrokerClosingAdvancedPanel({ defaultCity = "Montréal" }: { defaultCity?: string }) {
  const [city, setCity] = React.useState(defaultCity);
  const scripts = React.useMemo(() => getBrokerClosingPressureScripts(city), [city]);

  return (
    <section
      className="rounded-xl border border-amber-900/50 bg-amber-950/15 p-4"
      data-growth-broker-closing-advanced-v1
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-amber-300/90">Broker closing pressure (V1)</p>
          <h3 className="mt-1 text-lg font-semibold text-zinc-100">Activation & urgency</h3>
          <p className="mt-1 max-w-xl text-[11px] text-zinc-500">
            For your manual messages to brokers — paste into CRM or chat yourself.
          </p>
        </div>
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          City (reserved)
          <input
            className="w-44 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-100"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </label>
      </div>

      <ul className="mt-4 space-y-4">
        {scripts.map((s) => (
          <li key={s.type} className="rounded-lg border border-zinc-800/90 bg-black/30 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-400/90">{TYPE_LABEL[s.type]}</p>
            <pre className="mt-2 whitespace-pre-wrap font-sans text-sm leading-relaxed text-zinc-300">{s.message}</pre>
            <div className="mt-2">
              <CopyButton text={s.message} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
