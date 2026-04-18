"use client";

import type { CommandCenterRolePriority } from "../../company-command-center-v3.types";

export function PriorityList({ title, items }: { title: string; items: CommandCenterRolePriority[] }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-200/80">{title}</h3>
      <ul className="mt-2 space-y-2">
        {(items.length ? items : [{ id: "empty", label: "—", rationale: null }]).map((p) => (
          <li key={p.id} className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 px-3 py-2 text-xs text-zinc-200">
            {p.label}
            {p.rationale ? <span className="mt-1 block text-[10px] text-zinc-500">{p.rationale}</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
