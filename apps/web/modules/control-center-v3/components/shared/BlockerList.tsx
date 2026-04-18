"use client";

import type { CommandCenterRoleBlocker } from "../../company-command-center-v3.types";

export function BlockerList({ title, items }: { title: string; items: CommandCenterRoleBlocker[] }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-200/80">{title}</h3>
      <ul className="mt-2 space-y-1 text-xs text-amber-100/90">
        {(items.length ? items : [{ id: "empty", label: "—", rationale: null }]).map((p) => (
          <li key={p.id} className="border-b border-zinc-800/40 pb-1">
            {p.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
