"use client";

import { useState } from "react";

export type AnnexItem = { id: string; label: string; attached: boolean };

export function AnnexManager({
  items,
  onChange,
}: {
  items: AnnexItem[];
  onChange: (next: AnnexItem[]) => void;
}) {
  const [local, setLocal] = useState(items);

  function toggle(id: string) {
    const next = local.map((a) => (a.id === id ? { ...a, attached: !a.attached } : a));
    setLocal(next);
    onChange(next);
  }

  return (
    <div className="space-y-2 rounded-xl border border-zinc-800 p-4">
      <h4 className="text-sm font-medium text-zinc-200">Annexes</h4>
      <ul className="space-y-2">
        {local.map((a) => (
          <li key={a.id} className="flex items-center justify-between gap-2 text-sm text-zinc-300">
            <span>{a.label}</span>
            <button
              type="button"
              className="rounded-lg border border-zinc-600 px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-800"
              onClick={() => toggle(a.id)}
            >
              {a.attached ? "Attached" : "Attach"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
