"use client";

import * as React from "react";

const SCENARIOS = [
  {
    id: "A",
    title: "Suggest-only path",
    lines: ["Autonomy ON", "Enforcement ON", "Rows in suggest_only — advisory, no prefilled execution"],
  },
  {
    id: "B",
    title: "Blocked path",
    lines: ["Autonomy ON", "Enforcement ON", "Blocked (or frozen) rows visible with policy rationale"],
  },
  {
    id: "C",
    title: "Approval-required path",
    lines: ["Autonomy ON", "Enforcement ON", "approval_required — route to governance / admin review before changes"],
  },
  {
    id: "D",
    title: "Enforcement off — reduced behavior",
    lines: ["Autonomy ON", "Enforcement OFF or snapshot missing — reduced guardrails; counts still visible"],
  },
  {
    id: "E",
    title: "Kill switch",
    lines: ["Kill switch ON — autonomy surfaces suppressed safely; dashboard otherwise unchanged"],
  },
] as const;

export function GrowthAutonomyTestScenariosPanel() {
  return (
    <details className="mt-3 rounded-lg border border-zinc-800/80 bg-black/25 px-3 py-2 text-[11px] text-zinc-400">
      <summary className="cursor-pointer font-medium text-zinc-300">Internal test scenarios (A–E)</summary>
      <ul className="mt-2 space-y-2">
        {SCENARIOS.map((s) => (
          <li key={s.id}>
            <span className="font-semibold text-zinc-200">
              Scenario {s.id}: {s.title}
            </span>
            <ul className="ml-3 list-inside list-disc text-zinc-500">
              {s.lines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[10px] text-zinc-500">
        See <code className="rounded bg-zinc-900 px-1">docs/growth/growth-autonomy-validation-playbook.md</code> for flag
        combinations.
      </p>
    </details>
  );
}
