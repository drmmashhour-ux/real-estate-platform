"use client";

import { useState } from "react";

type Props = {
  label?: string;
  className?: string;
};

export function PrintPageButton({ label = "Print page", className }: Props) {
  const [busy, setBusy] = useState(false);

  async function handlePrint() {
    setBusy(true);
    try {
      window.print();
    } finally {
      window.setTimeout(() => setBusy(false), 300);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handlePrint()}
      disabled={busy}
      className={
        className ??
        "print:hidden rounded-full border border-white/15 px-4 py-2 text-sm text-slate-200 transition hover:border-premium-gold/40 hover:bg-white/5 disabled:opacity-60"
      }
    >
      {busy ? "Preparing print..." : label}
    </button>
  );
}
