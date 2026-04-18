"use client";

import * as React from "react";

import { build48hClosingPlaybook } from "@/modules/growth/closing-playbook.service";

export function ClosingPlaybookPanel() {
  const playbook = React.useMemo(() => build48hClosingPlaybook(), []);

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
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-zinc-300">
              {s.actions.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  );
}
