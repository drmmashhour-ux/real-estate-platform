"use client";

import * as React from "react";

import { getClosingTactics } from "@/modules/growth/closing-psychology.service";
import type { ClosingTrigger } from "@/modules/growth/closing-psychology.types";

const TRIGGER_LABEL: Record<ClosingTrigger, string> = {
  speed: "Speed",
  scarcity: "Scarcity",
  clarity: "Clarity",
  momentum: "Momentum",
  confidence: "Confidence",
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

export function ClosingPsychologyPanel({ defaultCity = "Montréal" }: { defaultCity?: string }) {
  const [city, setCity] = React.useState(defaultCity);
  const tactics = React.useMemo(() => getClosingTactics(city), [city]);

  return (
    <section
      className="rounded-xl border border-violet-900/45 bg-violet-950/15 p-4"
      data-growth-closing-psychology-v1
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-violet-300/90">Fast closing — psychology</p>
          <h3 className="mt-1 text-lg font-semibold text-zinc-100">Ethical nudges (V1)</h3>
          <p className="mt-1 max-w-xl text-[11px] text-zinc-500">
            Transparent, user-first language — you send manually. No false scarcity; timing labels describe when the line
            fits best.
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

      <ul className="mt-4 space-y-3">
        {tactics.map((t) => (
          <li key={t.trigger} className="rounded-lg border border-zinc-800/80 bg-black/25 p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <span className="text-sm font-semibold text-violet-100/90">{TRIGGER_LABEL[t.trigger]}</span>
                <p className="mt-1 text-xs text-zinc-500">
                  When: <span className="text-zinc-400">{t.timing}</span>
                </p>
              </div>
              <CopyBtn text={t.message} />
            </div>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">{t.message}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
