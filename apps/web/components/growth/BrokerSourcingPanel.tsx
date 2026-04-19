"use client";

import * as React from "react";

import { getBrokerSourcingInstructions } from "@/modules/growth/broker-sourcing.service";
import { postFastDealSourceEventLog } from "@/lib/growth/fast-deal-client-log";

function CopyButton({
  text,
  label = "Copy",
  onAfterCopy,
}: {
  text: string;
  label?: string;
  onAfterCopy?: () => void;
}) {
  const [done, setDone] = React.useState(false);
  return (
    <button
      type="button"
      className="rounded-md border border-zinc-600 bg-zinc-800/80 px-2 py-1 text-xs font-medium text-zinc-200 hover:bg-zinc-700"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          onAfterCopy?.();
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

export function BrokerSourcingPanel({
  defaultCity = "Montréal",
  enableFastDealLogging = false,
}: {
  defaultCity?: string;
  /** When true, best-effort log to Fast Deal results (admin session only). */
  enableFastDealLogging?: boolean;
}) {
  const [city, setCity] = React.useState(defaultCity);
  const instructions = React.useMemo(() => getBrokerSourcingInstructions(city), [city]);

  return (
    <section
      className="rounded-xl border border-cyan-900/40 bg-cyan-950/15 p-4"
      data-growth-broker-sourcing-v1
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan-300/90">Broker sourcing (V2)</p>
          <h3 className="mt-1 text-lg font-semibold text-zinc-100">Manual search playbook</h3>
          <p className="mt-1 max-w-xl text-[11px] text-zinc-500">
            You search and message — no bots, no external APIs. Replace city below to refresh queries.
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
        {instructions.map((block) => (
          <li key={block.platform} className="rounded-lg border border-zinc-800/90 bg-black/25 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-cyan-200/90">{block.title}</p>
              {enableFastDealLogging ? (
                <button
                  type="button"
                  className="rounded-md border border-cyan-800/60 bg-cyan-950/40 px-2 py-1 text-[11px] font-medium text-cyan-200 hover:bg-cyan-900/40"
                  onClick={() =>
                    void postFastDealSourceEventLog({
                      sourceType: "broker_sourcing",
                      sourceSubType: "session_started",
                      metadata: { platform: block.platform, city },
                    })
                  }
                >
                  Log session (this channel)
                </button>
              ) : null}
            </div>
            <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-zinc-300">
              {block.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
            <div className="mt-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Search queries</p>
              <ul className="mt-1 flex flex-wrap gap-2">
                {block.searchQueries.map((q) => (
                  <li key={q} className="flex items-center gap-1 rounded-md bg-zinc-800/80 px-2 py-1 font-mono text-[11px] text-zinc-300">
                    {q}
                    <CopyButton
                      text={q}
                      label="Copy"
                      onAfterCopy={
                        enableFastDealLogging
                          ? () =>
                              void postFastDealSourceEventLog({
                                sourceType: "broker_sourcing",
                                sourceSubType: "query_copied",
                                metadata: { platform: block.platform, query: q, city },
                              })
                          : undefined
                      }
                    />
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
