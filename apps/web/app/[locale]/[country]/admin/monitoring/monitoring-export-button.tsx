"use client";

import { useState } from "react";
import type { MonitoringSnapshot } from "@/lib/monitoring/types";

export function MonitoringExportButton({ snapshot }: { snapshot: MonitoringSnapshot }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-slate-100 hover:bg-white/10"
      onClick={async () => {
        const text = JSON.stringify(snapshot, null, 2);
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 2500);
        } catch {
          const w = window.open("", "_blank");
          if (w) {
            w.document.write(`<pre>${text.replace(/</g, "&lt;")}</pre>`);
          }
        }
      }}
    >
      {done ? "Copied snapshot" : "Copy monitoring JSON"}
    </button>
  );
}
