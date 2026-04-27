"use client";

import { useState } from "react";

export function G4DailyLogCopy({
  line,
  copyLabel,
  copiedLabel,
}: {
  line: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(line);
          setDone(true);
          window.setTimeout(() => setDone(false), 2000);
        } catch {
          /* ignore */
        }
      }}
      className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-800 hover:bg-stone-50"
    >
      {done ? copiedLabel : copyLabel}
    </button>
  );
}
