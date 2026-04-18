"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { CommandCenterSavedPreset } from "../company-command-center-v4.types";

export function PresetSelector({
  presets,
  activePresetId,
}: {
  presets: CommandCenterSavedPreset[];
  activePresetId: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function selectPreset(id: string) {
    const next = new URLSearchParams(searchParams.toString());
    const p = presets.find((x) => x.id === id);
    if (id && p) {
      next.set("presetId", id);
      next.set("role", p.role);
    } else {
      next.delete("presetId");
    }
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[10px] uppercase tracking-wide text-zinc-500">Preset</span>
      <select
        value={activePresetId ?? ""}
        onChange={(e) => selectPreset(e.target.value)}
        className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200"
      >
        <option value="">— None —</option>
        {presets.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <span className="text-[10px] text-zinc-600">Built-in only — custom save deferred.</span>
    </div>
  );
}
