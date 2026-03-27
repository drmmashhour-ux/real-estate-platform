"use client";

import { useState } from "react";

export function CopyListingCodeButton({
  listingCode,
  className = "",
  variant = "dark",
}: {
  listingCode: string;
  className?: string;
  variant?: "dark" | "light";
}) {
  const [done, setDone] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(listingCode);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch {
      setDone(false);
    }
  }

  const base =
    variant === "light"
      ? "border border-slate-600 bg-slate-800/60 text-slate-200 hover:bg-slate-700/80"
      : "border border-white/20 bg-white/10 text-white hover:bg-white/15";

  return (
    <button
      type="button"
      onClick={copy}
      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${base} ${className}`}
    >
      {done ? "Copied!" : "Copy Listing ID"}
    </button>
  );
}
