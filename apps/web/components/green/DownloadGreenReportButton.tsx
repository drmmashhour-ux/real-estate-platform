"use client";

import { useState } from "react";
import type { ReportTier } from "@/modules/green-ai/documents/document.types";

type Props = {
  /** POST body fields aligned with `/api/green/documents/generate` (same intake keys as green pipeline). */
  payload: Record<string, unknown>;
  tier?: ReportTier;
  className?: string;
};

export function DownloadGreenReportButton({ payload, tier = "basic", className }: Props) {
  const [busy, setBusy] = useState(false);

  async function download() {
    setBusy(true);
    try {
      const res = await fetch("/api/green/documents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          tier,
          format: "json",
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.warn("[green-report]", err);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lecipm-green-report-${tier}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => void download()}
      className={
        className ??
        "rounded-xl border border-emerald-500/40 bg-emerald-600/20 px-4 py-2 text-sm font-semibold text-emerald-50 hover:bg-emerald-600/30 disabled:opacity-50"
      }
    >
      {busy ? "Preparing…" : "Download Green Report"}
    </button>
  );
}
