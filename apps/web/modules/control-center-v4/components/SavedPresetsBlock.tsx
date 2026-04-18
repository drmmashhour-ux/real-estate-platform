"use client";

import type { CommandCenterSavedPreset } from "../company-command-center-v4.types";

export function SavedPresetsBlock({ presets }: { presets: CommandCenterSavedPreset[] }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Built-in presets</h3>
      <ul className="mt-3 space-y-2 text-xs text-zinc-400">
        {presets.map((p) => (
          <li key={p.id}>
            <span className="text-zinc-200">{p.name}</span> — role {p.role}
            {p.pinnedSystems?.length ? (
              <span className="block text-[10px] text-zinc-500">Pins: {p.pinnedSystems.join(", ")}</span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
