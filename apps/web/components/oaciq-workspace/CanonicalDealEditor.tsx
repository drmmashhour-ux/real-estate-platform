"use client";

import { useState } from "react";

/** Optional JSON overlay merged into canonical deal (stored client-side until POST). */
export function CanonicalDealEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (json: string) => void;
}) {
  const [parseErr, setParseErr] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-ds-text-secondary">Canonical overlay (JSON, partial `deal` shape)</label>
      <textarea
        value={value}
        onChange={(e) => {
          const t = e.target.value;
          onChange(t);
          if (!t.trim()) {
            setParseErr(null);
            return;
          }
          try {
            JSON.parse(t);
            setParseErr(null);
          } catch {
            setParseErr("Invalid JSON");
          }
        }}
        rows={5}
        className="w-full rounded-lg border border-ds-border bg-black/50 px-3 py-2 font-mono text-[11px] text-ds-text"
        spellCheck={false}
      />
      {parseErr ? <p className="text-xs text-amber-300">{parseErr}</p> : null}
    </div>
  );
}
