"use client";

import { useState } from "react";
import { ChannelBadge } from "./ChannelBadge";
import { m } from "./marketing-ui-classes";

export type ChannelOption = { code: string; name: string; channelType: string; enabled: boolean };

export function ChannelSelectorGrid({
  channels,
  selected,
  onChange,
  disabled,
}: {
  channels: ChannelOption[];
  selected: string[];
  onChange: (codes: string[]) => void;
  disabled?: boolean;
}) {
  const toggle = (code: string) => {
    if (disabled) return;
    if (selected.includes(code)) onChange(selected.filter((c) => c !== code));
    else onChange([...selected, code]);
  };

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {channels.map((ch) => {
        const on = selected.includes(ch.code);
        return (
          <button
            key={ch.code}
            type="button"
            disabled={disabled || !ch.enabled}
            onClick={() => toggle(ch.code)}
            className={`rounded-xl border p-3 text-left transition ${
              on
                ? "border-amber-500/60 bg-amber-950/20"
                : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-600"
            } ${!ch.enabled ? "opacity-40" : ""}`}
          >
            <ChannelBadge code={ch.code} />
            <p className="mt-1 text-xs text-zinc-400">{ch.name}</p>
            <p className="text-[10px] uppercase text-zinc-600">{ch.channelType}</p>
          </button>
        );
      })}
    </div>
  );
}

/** Controlled wrapper for forms that start empty. */
export function useChannelSelection(initial: string[] = []) {
  const [selected, setSelected] = useState<string[]>(initial);
  return { selected, setSelected };
}
