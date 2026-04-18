"use client";

import * as React from "react";

import { getBrokerClosingScripts } from "@/modules/growth/broker-onboarding.service";

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

function replaceCity(script: string, city: string): string {
  return script.split("[CITY]").join(city.trim() || "[CITY]");
}

export function BrokerClosingPanel({ defaultCity = "Montréal" }: { defaultCity?: string }) {
  const [city, setCity] = React.useState(defaultCity);
  const scripts = React.useMemo(() => getBrokerClosingScripts(), []);

  return (
    <section
      className="rounded-xl border border-lime-900/40 bg-lime-950/10 p-4"
      data-growth-broker-closing-panel-v1
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-lime-300/90">Broker onboarding + close</p>
          <h3 className="mt-1 text-lg font-semibold text-zinc-100">Call / DM scripts</h3>
          <p className="mt-1 max-w-xl text-[11px] text-zinc-500">
            Copy and deliver yourself — no automated sends. Gated by{" "}
            <code className="text-zinc-400">FEATURE_BROKER_CLOSING_V1</code>.
          </p>
        </div>
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          City
          <input
            className="w-40 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-100"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </label>
      </div>

      <ol className="mt-4 space-y-4">
        {scripts.map((s, idx) => {
          const body = replaceCity(s.script, city);
          return (
            <li key={s.id} className="rounded-lg border border-zinc-800/90 bg-black/25 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-zinc-200">
                  Step {idx + 1}: {s.title}
                </p>
                <span className="text-[10px] uppercase text-zinc-600">{s.id}</span>
              </div>
              <pre className="mt-2 whitespace-pre-wrap font-sans text-sm leading-relaxed text-zinc-300">{body}</pre>
              <div className="mt-2">
                <CopyButton text={body} />
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
