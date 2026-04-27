"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AutoLaunchButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);

  async function go(dryRun: boolean) {
    setErr(null);
    setSummary(null);
    setBusy(true);
    try {
      const res = await fetch("/api/marketing/campaign/auto-launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun }),
      });
      const j = (await res.json().catch(() => ({}))) as {
        error?: string;
        generated?: number;
        simulated?: number;
        selected?: number;
        scheduled?: number;
      };
      if (!res.ok) {
        setErr(j.error ?? "Request failed");
        return;
      }
      setSummary(
        `Generated ${j.generated ?? 0}, simulated ${j.simulated ?? 0}, selected ${j.selected ?? 0}, scheduled (intent) ${j.scheduled ?? 0}.`
      );
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            void go(true);
          }}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
        >
          {busy ? "…" : "Run (dry run)"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            void go(false);
          }}
          className="rounded-md border border-amber-600/50 px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-50 dark:text-amber-200 dark:hover:bg-amber-950/40"
        >
          {busy ? "…" : "Run (full: drafts + sim)"}
        </button>
      </div>
      {err ? <p className="text-xs text-destructive">{err}</p> : null}
      {summary ? <p className="text-xs text-muted-foreground">{summary}</p> : null}
    </div>
  );
}
