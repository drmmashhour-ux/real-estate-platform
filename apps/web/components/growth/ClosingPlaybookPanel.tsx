"use client";

import * as React from "react";

import { build48hClosingPlaybook } from "@/modules/growth/closing-playbook.service";
import { postFastDealSourceEventLog } from "@/lib/growth/fast-deal-client-log";

export function ClosingPlaybookPanel({
  enableFastDealLogging = false,
  defaultPlaybookCity = "Montréal",
}: {
  enableFastDealLogging?: boolean;
  /** Attributed to Fast Deal city comparison when logging. */
  defaultPlaybookCity?: string;
}) {
  const playbook = React.useMemo(() => build48hClosingPlaybook(), []);
  const [playbookCity, setPlaybookCity] = React.useState(defaultPlaybookCity);
  const cityMeta = React.useCallback(
    (extra: Record<string, unknown>) => ({ city: playbookCity.trim() || defaultPlaybookCity, ...extra }),
    [playbookCity, defaultPlaybookCity],
  );

  return (
    <section
      className="rounded-xl border border-rose-900/40 bg-rose-950/15 p-4"
      data-growth-closing-playbook-v1
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-rose-300/90">48-hour closing playbook (V2)</p>
        <h3 className="mt-1 text-lg font-semibold text-zinc-100">Aggressive timeline (manual)</h3>
        <p className="mt-1 max-w-xl text-[11px] text-zinc-500">
          Checklist only — you run outreach, ads setup, and CRM follow-ups yourself. No automated messages.
        </p>
        {enableFastDealLogging ? (
          <label className="mt-3 flex max-w-xs flex-col gap-1 text-xs text-zinc-400">
            City label (for results)
            <input
              className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-100"
              value={playbookCity}
              onChange={(e) => setPlaybookCity(e.target.value)}
            />
          </label>
        ) : null}
      </div>

      <ol className="mt-4 space-y-3">
        {playbook.steps.map((s) => (
          <li
            key={s.step}
            className="rounded-lg border border-zinc-800/90 bg-black/30 px-3 py-3"
            data-closing-step={s.step}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-semibold text-rose-200/90">
                STEP {s.step} ({s.title})
              </p>
              <span className="text-[11px] uppercase text-zinc-500">Playbook</span>
            </div>
            {enableFastDealLogging ? (
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded border border-rose-800/50 bg-rose-950/30 px-2 py-0.5 text-[11px] text-rose-200 hover:bg-rose-900/30"
                  onClick={() =>
                    void postFastDealSourceEventLog({
                      sourceType: "closing_playbook",
                      sourceSubType: "step_acknowledged",
                      metadata: cityMeta({ step: s.step, playbookKey: playbook.id }),
                    })
                  }
                >
                  Log step acknowledged
                </button>
                <button
                  type="button"
                  className="rounded border border-rose-800/50 bg-rose-950/30 px-2 py-0.5 text-[11px] text-rose-200 hover:bg-rose-900/30"
                  onClick={() =>
                    void postFastDealSourceEventLog({
                      sourceType: "closing_playbook",
                      sourceSubType: "step_completed",
                      metadata: cityMeta({ step: s.step, playbookKey: playbook.id }),
                    })
                  }
                >
                  Log step completed
                </button>
              </div>
            ) : null}
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-zinc-300">
              {s.actions.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
      {enableFastDealLogging ? (
        <div className="mt-4">
          <button
            type="button"
            className="rounded-lg border border-rose-800/60 bg-rose-950/30 px-3 py-2 text-xs font-medium text-rose-100 hover:bg-rose-900/40"
            onClick={() =>
              void postFastDealSourceEventLog({
                sourceType: "closing_playbook",
                sourceSubType: "playbook_session_completed",
                metadata: cityMeta({ playbookKey: playbook.id }),
              })
            }
          >
            Log full playbook session completed
          </button>
        </div>
      ) : null}
    </section>
  );
}
