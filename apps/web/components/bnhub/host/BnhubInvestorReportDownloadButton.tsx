"use client";

import { useState } from "react";

const GOLD = "#D4AF37";

export function BnhubInvestorReportDownloadButton() {
  const [busy, setBusy] = useState(false);

  async function download() {
    setBusy(true);
    try {
      const res = await fetch("/api/revenue/report", {
        credentials: "same-origin",
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { detail?: string; error?: string };
        throw new Error(j.detail || j.error || res.statusText || "Request failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "BNHub_Report.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Could not download report.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void download()}
      disabled={busy}
      className="rounded-lg border border-zinc-700 bg-black px-4 py-2 text-sm font-medium text-white transition hover:border-zinc-500 disabled:opacity-50"
      style={{ borderColor: busy ? undefined : GOLD }}
    >
      {busy ? "Generating PDF…" : "Download investor report (PDF)"}
    </button>
  );
}
