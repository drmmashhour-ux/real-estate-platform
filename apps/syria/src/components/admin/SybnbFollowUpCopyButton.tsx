"use client";

import { useState } from "react";

/** Clipboard helper for SYBNB-70 manual follow-up Arabic template */
export function SybnbFollowUpCopyButton({
  text,
  copiedLabel,
  idleLabel,
}: {
  text: string;
  copiedLabel: string;
  idleLabel: string;
}) {
  const [done, setDone] = useState(false);

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      window.setTimeout(() => setDone(false), 2500);
    } catch {
      setDone(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void copyToClipboard()}
      className="rounded-xl bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-800"
    >
      {done ? copiedLabel : idleLabel}
    </button>
  );
}
