"use client";

import type { CommandCenterRoleRisk } from "../../company-command-center-v3.types";

export function RiskList({ title, items }: { title: string; items: CommandCenterRoleRisk[] }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-rose-200/80">{title}</h3>
      <ul className="mt-2 space-y-1 text-xs text-zinc-300">
        {(items.length ? items : [{ id: "empty", label: "—", rationale: null }]).map((p) => (
          <li key={p.id} className="border-b border-zinc-800/50 pb-1">
            {p.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
